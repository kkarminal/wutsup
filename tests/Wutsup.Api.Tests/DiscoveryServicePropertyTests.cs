// Feature: discovery-results-feed, Property 1: Descendant node resolution correctness

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

using Wutsup.Api.Data;
using Wutsup.Api.Models;
using Wutsup.Api.Services;

namespace Wutsup.Api.Tests;

// ---------------------------------------------------------------------------
// Tree generation model
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a generated navigation tree for property testing.
/// </summary>
public record GeneratedTree(List<GeneratedNode> AllNodes, List<GeneratedItem> AllItems);

/// <summary>
/// Represents a single node in the generated tree.
/// </summary>
public record GeneratedNode(int Id, int? ParentId, string Label);

/// <summary>
/// Represents a single discovery item assigned to a node.
/// </summary>
public record GeneratedItem(int Id, string Name, int NavigationNodeId);

// ---------------------------------------------------------------------------
// Arbitrary generators for tree structures
// ---------------------------------------------------------------------------

/// <summary>
/// Generates random navigation trees (1–4 levels, 2–5 children per node)
/// with random items distributed across nodes.
/// </summary>
public static class TreeGenerator
{
    /// <summary>
    /// Generates a random tree with 1–4 levels and 2–5 children per node,
    /// plus random items distributed across all nodes.
    /// </summary>
    public static Gen<GeneratedTree> GenTree()
    {
        return from levels in Gen.Choose(1, 4)
               from childrenPerNode in Gen.Choose(2, 5)
               from itemsPerNode in Gen.Choose(0, 3)
               select BuildTree(levels, childrenPerNode, itemsPerNode);
    }

    private static GeneratedTree BuildTree(int levels, int childrenPerNode, int itemsPerNode)
    {
        var nodes = new List<GeneratedNode>();
        var items = new List<GeneratedItem>();
        var nextNodeId = 1;
        var nextItemId = 1;

        // Create root node
        var root = new GeneratedNode(nextNodeId++, null, "Root");
        nodes.Add(root);

        // Build tree level by level
        var currentLevel = new List<GeneratedNode> { root };

        for (int level = 1; level < levels; level++)
        {
            var nextLevel = new List<GeneratedNode>();
            foreach (var parent in currentLevel)
            {
                for (int c = 0; c < childrenPerNode; c++)
                {
                    var child = new GeneratedNode(nextNodeId++, parent.Id, $"Node_{nextNodeId - 1}");
                    nodes.Add(child);
                    nextLevel.Add(child);
                }
            }
            currentLevel = nextLevel;
        }

        // Distribute items across all nodes
        foreach (var node in nodes)
        {
            for (int i = 0; i < itemsPerNode; i++)
            {
                var item = new GeneratedItem(nextItemId++, $"Item_{nextItemId - 1}", node.Id);
                items.Add(item);
            }
        }

        return new GeneratedTree(nodes, items);
    }

    public static Arbitrary<GeneratedTree> Arbitrary() => GenTree().ToArbitrary();
}

/// <summary>
/// Wraps a GeneratedTree with a randomly chosen query node index.
/// </summary>
public record TreeWithQueryNode(GeneratedTree Tree, int QueryNodeIndex);

public static class TreeWithQueryNodeGenerator
{
    public static Gen<TreeWithQueryNode> GenTreeWithQueryNode()
    {
        return TreeGenerator.GenTree().SelectMany(tree =>
            Gen.Choose(0, tree.AllNodes.Count - 1)
               .Select(idx => new TreeWithQueryNode(tree, idx)));
    }

    public static Arbitrary<TreeWithQueryNode> Arbitrary() => GenTreeWithQueryNode().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Pagination test input model
// ---------------------------------------------------------------------------

/// <summary>
/// Wraps parameters for pagination slice correctness testing.
/// </summary>
public record PaginationTestInput(int ItemCount, int Page, int PageSize);

public static class PaginationTestInputGenerator
{
    public static Gen<PaginationTestInput> GenPaginationInput()
    {
        return from itemCount in Gen.Choose(1, 200)
               from page in Gen.Choose(1, 10)
               from pageSize in Gen.Choose(1, 50)
               select new PaginationTestInput(itemCount, page, pageSize);
    }

    public static Arbitrary<PaginationTestInput> Arbitrary() => GenPaginationInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Ordering test input model
// ---------------------------------------------------------------------------

/// <summary>
/// Wraps parameters for result ordering invariant testing.
/// </summary>
public record OrderingTestInput(int ItemCount, List<DateTime> Timestamps);

public static class OrderingTestInputGenerator
{
    public static Gen<OrderingTestInput> GenOrderingInput()
    {
        return from itemCount in Gen.Choose(2, 50)
               from timestamps in GenTimestamps(itemCount)
               select new OrderingTestInput(itemCount, timestamps);
    }

    private static Gen<List<DateTime>> GenTimestamps(int count)
    {
        // Generate random timestamps within a 1-year range
        var baseDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var timestampGen = Gen.Choose(0, 525600) // minutes in a year
            .Select(minutes => baseDate.AddMinutes(minutes));
        return Gen.ArrayOf(timestampGen, count)
            .Select(ts => ts.ToList());
    }

    public static Arbitrary<OrderingTestInput> Arbitrary() => GenOrderingInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// CategoryLabel test input model
// ---------------------------------------------------------------------------

/// <summary>
/// Represents a node with a random label for CategoryLabel join testing.
/// </summary>
public record CategoryLabelNode(int Id, string Label);

/// <summary>
/// Represents an item linked to a specific node for CategoryLabel join testing.
/// </summary>
public record CategoryLabelItem(int Id, string Name, int NavigationNodeId);

/// <summary>
/// Wraps parameters for CategoryLabel join correctness testing.
/// Contains a list of nodes with random labels and items linked to them.
/// </summary>
public record CategoryLabelTestInput(List<CategoryLabelNode> Nodes, List<CategoryLabelItem> Items);

public static class CategoryLabelTestInputGenerator
{
    public static Gen<CategoryLabelTestInput> GenCategoryLabelInput()
    {
        return from nodeCount in Gen.Choose(1, 10)
               from labels in Gen.ArrayOf(
                   ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get),
                   nodeCount)
               from itemsPerNode in Gen.Choose(1, 5)
               select BuildCategoryLabelInput(labels.ToList(), itemsPerNode);
    }

    private static CategoryLabelTestInput BuildCategoryLabelInput(List<string> labels, int itemsPerNode)
    {
        var nodes = new List<CategoryLabelNode>();
        var items = new List<CategoryLabelItem>();
        var nextItemId = 1;

        for (int i = 0; i < labels.Count; i++)
        {
            var nodeId = i + 1;
            nodes.Add(new CategoryLabelNode(nodeId, labels[i]));

            for (int j = 0; j < itemsPerNode; j++)
            {
                items.Add(new CategoryLabelItem(nextItemId++, $"Item_{nextItemId - 1}", nodeId));
            }
        }

        return new CategoryLabelTestInput(nodes, items);
    }

    public static Arbitrary<CategoryLabelTestInput> Arbitrary() => GenCategoryLabelInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// DiscoveryItemDto generator for serialization tests
// ---------------------------------------------------------------------------

public static class DiscoveryItemDtoGenerator
{
    public static Gen<DiscoveryItemDto> GenDiscoveryItemDto()
    {
        return from id in Gen.Choose(1, 10000)
               from name in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from description in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from latitude in Gen.Choose(-9000, 9000).Select(v => v / 100.0)
               from longitude in Gen.Choose(-18000, 18000).Select(v => v / 100.0)
               from city in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from address in Gen.OneOf(
                   Gen.Constant<string?>(null),
                   ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => (string?)s.Get))
               from imageUrl in Gen.OneOf(
                   Gen.Constant<string?>(null),
                   Gen.Constant<string?>("https://picsum.photos/400/300"))
               from navigationNodeId in Gen.Choose(1, 1000)
               from categoryLabel in ArbMap.Default.GeneratorFor<NonEmptyString>().Select(s => s.Get)
               from hasMetadata in ArbMap.Default.GeneratorFor<bool>()
               let metadata = hasMetadata ? (object?)new Dictionary<string, object> { ["key"] = "value" } : null
               select new DiscoveryItemDto(
                   id, name, description, latitude, longitude, city,
                   address, imageUrl, navigationNodeId, categoryLabel, metadata);
    }

    public static Arbitrary<DiscoveryItemDto> Arbitrary() => GenDiscoveryItemDto().ToArbitrary();
}

// ---------------------------------------------------------------------------
// JSON value generator for metadata round-trip testing
// ---------------------------------------------------------------------------

/// <summary>
/// Generates random JSON objects (nested, arrays, strings, numbers, booleans, nulls)
/// for testing JSONB metadata storage round-trip.
/// </summary>
public static class JsonValueGenerator
{
    private const int MaxDepth = 3;

    /// <summary>
    /// Generates a random JSON value (object, array, string, number, boolean, or null)
    /// with limited recursion depth to avoid stack overflow.
    /// </summary>
    public static Gen<JsonElement> GenJsonValue(int depth = 0)
    {
        if (depth >= MaxDepth)
        {
            // At max depth, only generate leaf values
            return GenLeafValue();
        }

        return Gen.OneOf(
            GenLeafValue(),
            GenJsonObject(depth + 1),
            GenJsonArray(depth + 1)
        );
    }

    private static Gen<JsonElement> GenLeafValue()
    {
        return Gen.OneOf(
            GenJsonString(),
            GenJsonNumber(),
            GenJsonBoolean(),
            GenJsonNull()
        );
    }

    private static Gen<JsonElement> GenJsonString()
    {
        // Generate safe ASCII strings (avoid control characters that break JSON)
        return Gen.Choose(1, 20)
            .SelectMany(len =>
                Gen.ArrayOf(Gen.Choose(32, 126).Select(c => (char)c), len)
                   .Select(chars => new string(chars)))
            .Select(s =>
            {
                // Escape backslashes and quotes for valid JSON
                var escaped = s.Replace("\\", "\\\\").Replace("\"", "\\\"");
                return JsonDocument.Parse($"\"{escaped}\"").RootElement.Clone();
            });
    }

    private static Gen<JsonElement> GenJsonNumber()
    {
        return Gen.OneOf(
            // Integers
            Gen.Choose(-10000, 10000).Select(n =>
                JsonDocument.Parse(n.ToString()).RootElement.Clone()),
            // Decimals
            Gen.Choose(-10000, 10000).Select(n =>
                JsonDocument.Parse((n / 100.0).ToString("G")).RootElement.Clone())
        );
    }

    private static Gen<JsonElement> GenJsonBoolean()
    {
        return ArbMap.Default.GeneratorFor<bool>().Select(b =>
            JsonDocument.Parse(b ? "true" : "false").RootElement.Clone());
    }

    private static Gen<JsonElement> GenJsonNull()
    {
        return Gen.Constant(JsonDocument.Parse("null").RootElement.Clone());
    }

    private static Gen<JsonElement> GenJsonObject(int depth)
    {
        return Gen.Choose(1, 5).SelectMany(count =>
            Gen.ArrayOf(GenKeyValuePair(depth), count)
               .Select(pairs =>
               {
                   // Deduplicate keys (last one wins)
                   var dict = new Dictionary<string, JsonElement>();
                   foreach (var (key, value) in pairs)
                   {
                       dict[key] = value;
                   }

                   var jsonParts = dict.Select(kv =>
                   {
                       var keyJson = JsonSerializer.Serialize(kv.Key);
                       var valueJson = kv.Value.GetRawText();
                       return $"{keyJson}:{valueJson}";
                   });
                   var json = "{" + string.Join(",", jsonParts) + "}";
                   return JsonDocument.Parse(json).RootElement.Clone();
               }));
    }

    private static Gen<JsonElement> GenJsonArray(int depth)
    {
        return Gen.Choose(0, 5).SelectMany(count =>
            Gen.ArrayOf(GenJsonValue(depth), count)
               .Select(elements =>
               {
                   var json = "[" + string.Join(",", elements.Select(e => e.GetRawText())) + "]";
                   return JsonDocument.Parse(json).RootElement.Clone();
               }));
    }

    private static Gen<(string Key, JsonElement Value)> GenKeyValuePair(int depth)
    {
        // Generate simple alphanumeric keys
        var keyGen = Gen.Choose(1, 10)
            .SelectMany(len =>
                Gen.ArrayOf(
                    Gen.OneOf(
                        Gen.Choose(97, 122).Select(c => (char)c),  // a-z
                        Gen.Choose(65, 90).Select(c => (char)c),   // A-Z
                        Gen.Choose(48, 57).Select(c => (char)c)    // 0-9
                    ), len)
                   .Select(chars => new string(chars)));

        return keyGen.SelectMany(key =>
            GenJsonValue(depth).Select(value => (key, value)));
    }

    /// <summary>
    /// Generates a random JSON object (always an object at the top level) as a string.
    /// </summary>
    public static Gen<string> GenJsonObjectString()
    {
        return GenJsonObject(0).Select(e => e.GetRawText());
    }

    public static Arbitrary<string> JsonObjectStringArbitrary() => GenJsonObjectString().ToArbitrary();
}

/// <summary>
/// Wraps a generated JSON string for use with FsCheck Arbitrary.
/// </summary>
public record MetadataJsonInput(string JsonString);

public static class MetadataJsonInputGenerator
{
    public static Gen<MetadataJsonInput> GenMetadataJsonInput()
    {
        return JsonValueGenerator.GenJsonObjectString()
            .Select(json => new MetadataJsonInput(json));
    }

    public static Arbitrary<MetadataJsonInput> Arbitrary() => GenMetadataJsonInput().ToArbitrary();
}

// ---------------------------------------------------------------------------
// Property test class
// ---------------------------------------------------------------------------

public class DiscoveryServicePropertyTests
{
    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Creates a SQLite in-memory database context that supports recursive CTEs.
    /// Configures DateTimeOffset to be stored as ticks to avoid SQLite limitations.
    /// </summary>
    private static (AppDbContext DbContext, SqliteConnection Connection) CreateSqliteDbContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        var dbContext = new AppDbContext(options);

        // Create the schema
        dbContext.Database.EnsureCreated();

        return (dbContext, connection);
    }

    /// <summary>
    /// Seeds the database with the generated tree nodes and items.
    /// </summary>
    private static async Task SeedDatabaseAsync(AppDbContext dbContext, GeneratedTree tree)
    {
        var now = DateTimeOffset.UtcNow;

        // Insert nodes using raw SQL to handle SQLite identity columns
        foreach (var node in tree.AllNodes)
        {
            var parentIdParam = node.ParentId.HasValue ? node.ParentId.Value.ToString() : "NULL";
            var sql = $"INSERT INTO navigation_nodes (id, label, icon, parent_id, sort_order, created_at, updated_at) VALUES ({node.Id}, '{node.Label}', NULL, {parentIdParam}, 0, '{now:yyyy-MM-dd HH:mm:ss}', '{now:yyyy-MM-dd HH:mm:ss}')";
            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        // Insert items with staggered timestamps so ordering is deterministic
        for (int i = 0; i < tree.AllItems.Count; i++)
        {
            var genItem = tree.AllItems[i];
            var itemTime = now.AddMinutes(-i);
            var sql = $"INSERT INTO discovery_items (id, name, description, latitude, longitude, city, address, image_url, navigation_node_id, metadata, created_at, updated_at) VALUES ({genItem.Id}, '{genItem.Name}', 'Description', 30.0, -97.0, 'TestCity', NULL, NULL, {genItem.NavigationNodeId}, NULL, '{itemTime:yyyy-MM-dd HH:mm:ss}', '{now:yyyy-MM-dd HH:mm:ss}')";
            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }
    }

    /// <summary>
    /// Computes expected descendant node IDs using a simple recursive function.
    /// This is the oracle — the "obviously correct" implementation.
    /// </summary>
    private static HashSet<int> ComputeDescendants(List<GeneratedNode> allNodes, int nodeId)
    {
        var result = new HashSet<int> { nodeId };
        var queue = new Queue<int>();
        queue.Enqueue(nodeId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            foreach (var child in allNodes.Where(n => n.ParentId == current))
            {
                if (result.Add(child.Id))
                {
                    queue.Enqueue(child.Id);
                }
            }
        }

        return result;
    }

    /// <summary>
    /// Queries descendant node IDs using the same recursive CTE as DiscoveryService.
    /// </summary>
    private static async Task<List<int>> GetDescendantIdsViaCte(AppDbContext dbContext, int nodeId)
    {
        var sql = @"
            WITH RECURSIVE descendants AS (
                SELECT id FROM navigation_nodes WHERE id = {0}
                UNION ALL
                SELECT n.id FROM navigation_nodes n
                INNER JOIN descendants d ON n.parent_id = d.id
            )
            SELECT id FROM descendants";

        return await dbContext.Database
            .SqlQueryRaw<int>(sql, nodeId)
            .ToListAsync();
    }

    // -----------------------------------------------------------------------
    // Property 1 — Descendant node resolution correctness
    // Validates: Requirements 2.2
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(TreeWithQueryNodeGenerator) })]
    public async Task<bool> GetItemsAsync_ReturnsExactlyItemsOnNodeOrDescendants(TreeWithQueryNode input)
    {
        // Feature: discovery-results-feed, Property 1: Descendant node resolution correctness
        var (dbContext, connection) = CreateSqliteDbContext();
        try
        {
            await SeedDatabaseAsync(dbContext, input.Tree);

            var queryNode = input.Tree.AllNodes[input.QueryNodeIndex];

            // Compute expected descendants using our oracle (BFS)
            var expectedDescendantIds = ComputeDescendants(input.Tree.AllNodes, queryNode.Id);

            // Query descendant IDs using the same recursive CTE as DiscoveryService
            var actualDescendantIds = await GetDescendantIdsViaCte(dbContext, queryNode.Id);
            var actualDescendantSet = actualDescendantIds.ToHashSet();

            // Verify the CTE returns the correct descendant set
            if (!actualDescendantSet.SetEquals(expectedDescendantIds))
            {
                return false;
            }

            // Compute expected items: those whose NavigationNodeId is in the descendant set
            var expectedItemIds = input.Tree.AllItems
                .Where(item => expectedDescendantIds.Contains(item.NavigationNodeId))
                .Select(item => item.Id)
                .ToHashSet();

            // Query actual items using the descendant IDs (same logic as DiscoveryService)
            var actualItems = await dbContext.DiscoveryItems
                .Where(di => actualDescendantIds.Contains(di.NavigationNodeId))
                .Select(di => di.Id)
                .ToListAsync();

            var actualItemIds = actualItems.ToHashSet();

            // Assert: exact match — no more, no less
            return actualItemIds.SetEquals(expectedItemIds);
        }
        finally
        {
            dbContext.Dispose();
            connection.Dispose();
        }
    }

    // -----------------------------------------------------------------------
    // Property 2 — Pagination slice correctness
    // Validates: Requirements 2.3, 2.4
    //
    // Since SQLite does not support DateTimeOffset in ORDER BY clauses,
    // we test the pagination logic at the database level using raw SQL
    // that mirrors the DiscoveryService query pattern (ORDER BY created_at DESC
    // with OFFSET/LIMIT).
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(PaginationTestInputGenerator) })]
    public async Task<bool> GetItemsAsync_ReturnsPaginationSliceCorrectly(PaginationTestInput input)
    {
        // Feature: discovery-results-feed, Property 2: Pagination slice correctness
        var (dbContext, connection) = CreateSqliteDbContext();
        try
        {
            var baseTime = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);

            // Create a single root node to hold all items
            var rootNodeSql = $"INSERT INTO navigation_nodes (id, label, icon, parent_id, sort_order, created_at, updated_at) VALUES (1, 'Root', NULL, NULL, 0, '{baseTime:yyyy-MM-dd HH:mm:ss}', '{baseTime:yyyy-MM-dd HH:mm:ss}')";
            await dbContext.Database.ExecuteSqlRawAsync(rootNodeSql);

            // Insert items with distinct created_at timestamps (staggered by 1 minute each)
            // Item with id=1 gets the newest timestamp, id=2 gets next newest, etc.
            for (int i = 0; i < input.ItemCount; i++)
            {
                var itemTime = baseTime.AddMinutes(-i); // item 0 is newest, item N-1 is oldest
                var itemSql = $"INSERT INTO discovery_items (id, name, description, latitude, longitude, city, address, image_url, navigation_node_id, metadata, created_at, updated_at) VALUES ({i + 1}, 'Item_{i + 1}', 'Description', 30.0, -97.0, 'TestCity', NULL, NULL, 1, NULL, '{itemTime:yyyy-MM-dd HH:mm:ss}', '{baseTime:yyyy-MM-dd HH:mm:ss}')";
                await dbContext.Database.ExecuteSqlRawAsync(itemSql);
            }

            // Query using the same pagination pattern as DiscoveryService:
            // - Filter by navigation_node_id (all items belong to node 1)
            // - ORDER BY created_at DESC
            // - OFFSET/LIMIT pagination
            var offset = (input.Page - 1) * input.PageSize;

            // Get total count (same as DiscoveryService does)
            var totalCountResult = await dbContext.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS \"Value\" FROM discovery_items WHERE navigation_node_id = 1")
                .ToListAsync();
            var totalCount = totalCountResult.First();

            // Get paginated items ordered by created_at DESC
#pragma warning disable EF1002 // Test-only code with controlled integer values
            var paginatedItemIds = await dbContext.Database
                .SqlQueryRaw<int>($"SELECT id AS \"Value\" FROM discovery_items WHERE navigation_node_id = 1 ORDER BY created_at DESC LIMIT {input.PageSize} OFFSET {offset}")
                .ToListAsync();
#pragma warning restore EF1002

            // Assert: totalCount equals the total number of items
            if (totalCount != input.ItemCount)
            {
                return false;
            }

            // Assert: items.length <= pageSize
            if (paginatedItemIds.Count > input.PageSize)
            {
                return false;
            }

            // Compute expected slice: items are ordered by created_at DESC
            // Item IDs in descending created_at order: 1, 2, 3, ..., ItemCount
            // (because id=1 has the newest timestamp, id=2 has next newest, etc.)
            var allItemIdsOrdered = Enumerable.Range(1, input.ItemCount).ToList();

            var expectedSlice = allItemIdsOrdered
                .Skip(offset)
                .Take(input.PageSize)
                .ToList();

            // Assert: returned items match the expected offset/limit slice
            if (paginatedItemIds.Count != expectedSlice.Count)
            {
                return false;
            }

            for (int i = 0; i < paginatedItemIds.Count; i++)
            {
                if (paginatedItemIds[i] != expectedSlice[i])
                {
                    return false;
                }
            }

            return true;
        }
        finally
        {
            dbContext.Dispose();
            connection.Dispose();
        }
    }

    // -----------------------------------------------------------------------
    // Property 3 — Result ordering invariant
    // Validates: Requirements 2.6
    //
    // Generates random items with random created_at timestamps, seeds them
    // into a single root node, queries using ORDER BY created_at DESC (same
    // pattern as DiscoveryService), and asserts descending order.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(OrderingTestInputGenerator) })]
    public async Task<bool> GetItemsAsync_ReturnsItemsInDescendingCreatedAtOrder(OrderingTestInput input)
    {
        // Feature: discovery-results-feed, Property 3: Result ordering invariant
        var (dbContext, connection) = CreateSqliteDbContext();
        try
        {
            var baseTime = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);

            // Create a single root node to hold all items
            var rootNodeSql = $"INSERT INTO navigation_nodes (id, label, icon, parent_id, sort_order, created_at, updated_at) VALUES (1, 'Root', NULL, NULL, 0, '{baseTime:yyyy-MM-dd HH:mm:ss}', '{baseTime:yyyy-MM-dd HH:mm:ss}')";
            await dbContext.Database.ExecuteSqlRawAsync(rootNodeSql);

            // Insert items with random created_at timestamps from the generator
            for (int i = 0; i < input.ItemCount; i++)
            {
                var itemTime = input.Timestamps[i];
                var itemSql = $"INSERT INTO discovery_items (id, name, description, latitude, longitude, city, address, image_url, navigation_node_id, metadata, created_at, updated_at) VALUES ({i + 1}, 'Item_{i + 1}', 'Description', 30.0, -97.0, 'TestCity', NULL, NULL, 1, NULL, '{itemTime:yyyy-MM-dd HH:mm:ss}', '{baseTime:yyyy-MM-dd HH:mm:ss}')";
                await dbContext.Database.ExecuteSqlRawAsync(itemSql);
            }

            // Query items using the same ORDER BY created_at DESC pattern as DiscoveryService
#pragma warning disable EF1002 // Test-only code with controlled integer values
            var orderedTimestamps = await dbContext.Database
                .SqlQueryRaw<string>($"SELECT created_at AS \"Value\" FROM discovery_items WHERE navigation_node_id = 1 ORDER BY created_at DESC")
                .ToListAsync();
#pragma warning restore EF1002

            // Assert: each item's created_at is >= the next item's created_at (descending order)
            for (int i = 0; i < orderedTimestamps.Count - 1; i++)
            {
                var current = DateTime.Parse(orderedTimestamps[i]);
                var next = DateTime.Parse(orderedTimestamps[i + 1]);

                if (current < next)
                {
                    return false; // Ordering violated: current is older than next
                }
            }

            return true;
        }
        finally
        {
            dbContext.Dispose();
            connection.Dispose();
        }
    }

    // -----------------------------------------------------------------------
    // Property 4 — Response serialization structure
    // Validates: Requirements 2.7, 9.1
    //
    // Generates random DiscoveryItemDto objects, serializes them to JSON using
    // System.Text.Json with camelCase naming policy (same as ASP.NET Core default),
    // and asserts all required fields are present with correct camelCase names
    // and matching values.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(DiscoveryItemDtoGenerator) })]
    public bool SerializedJson_UsesCamelCaseAndIncludesAllRequiredFields(DiscoveryItemDto dto)
    {
        // Feature: discovery-results-feed, Property 4: Response serialization structure
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(dto, options);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Assert: all required camelCase fields are present
        var requiredFields = new[]
        {
            "id", "name", "description", "latitude", "longitude",
            "city", "navigationNodeId", "categoryLabel", "metadata"
        };

        foreach (var field in requiredFields)
        {
            if (!root.TryGetProperty(field, out _))
            {
                return false; // Required field missing from serialized JSON
            }
        }

        // Assert: field values match the original DTO
        if (root.GetProperty("id").GetInt32() != dto.Id)
            return false;

        if (root.GetProperty("name").GetString() != dto.Name)
            return false;

        if (root.GetProperty("description").GetString() != dto.Description)
            return false;

        if (Math.Abs(root.GetProperty("latitude").GetDouble() - dto.Latitude) > 0.0001)
            return false;

        if (Math.Abs(root.GetProperty("longitude").GetDouble() - dto.Longitude) > 0.0001)
            return false;

        if (root.GetProperty("city").GetString() != dto.City)
            return false;

        if (root.GetProperty("navigationNodeId").GetInt32() != dto.NavigationNodeId)
            return false;

        if (root.GetProperty("categoryLabel").GetString() != dto.CategoryLabel)
            return false;

        // Verify metadata: null should serialize as JSON null, non-null should be an object
        var metadataElement = root.GetProperty("metadata");
        if (dto.Metadata == null)
        {
            if (metadataElement.ValueKind != JsonValueKind.Null)
                return false;
        }
        else
        {
            if (metadataElement.ValueKind != JsonValueKind.Object)
                return false;
        }

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 5 — CategoryLabel join correctness
    // Validates: Requirements 9.2
    //
    // Generates random nodes with random labels and random items linked to
    // those nodes. Seeds the SQLite database, queries items using the same
    // join pattern as DiscoveryService (join discovery_items with
    // navigation_nodes to get categoryLabel), and asserts that each returned
    // item's categoryLabel matches the label of the navigation node it's
    // linked to.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(CategoryLabelTestInputGenerator) })]
    public async Task<bool> GetItemsAsync_CategoryLabelMatchesLinkedNodeLabel(CategoryLabelTestInput input)
    {
        // Feature: discovery-results-feed, Property 5: CategoryLabel join correctness
        var (dbContext, connection) = CreateSqliteDbContext();
        try
        {
            var baseTime = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
            var baseTimeStr = baseTime.ToString("yyyy-MM-dd HH:mm:ss");

            // Insert nodes with random labels using parameterized queries to handle special characters
            foreach (var node in input.Nodes)
            {
                if (node.Id == 1)
                {
                    // Root node has no parent
                    await dbContext.Database.ExecuteSqlRawAsync(
                        "INSERT INTO navigation_nodes (id, label, icon, parent_id, sort_order, created_at, updated_at) VALUES ({0}, {1}, NULL, NULL, 0, {2}, {3})",
                        node.Id, node.Label, baseTimeStr, baseTimeStr);
                }
                else
                {
                    // Child nodes are children of root (node 1)
                    await dbContext.Database.ExecuteSqlRawAsync(
                        "INSERT INTO navigation_nodes (id, label, icon, parent_id, sort_order, created_at, updated_at) VALUES ({0}, {1}, NULL, {2}, 0, {3}, {4})",
                        node.Id, node.Label, 1, baseTimeStr, baseTimeStr);
                }
            }

            // Insert items linked to their respective nodes
            for (int i = 0; i < input.Items.Count; i++)
            {
                var item = input.Items[i];
                var itemTime = baseTime.AddMinutes(-i).ToString("yyyy-MM-dd HH:mm:ss");
                await dbContext.Database.ExecuteSqlRawAsync(
                    "INSERT INTO discovery_items (id, name, description, latitude, longitude, city, address, image_url, navigation_node_id, metadata, created_at, updated_at) VALUES ({0}, {1}, {2}, {3}, {4}, {5}, NULL, NULL, {6}, NULL, {7}, {8})",
                    item.Id, item.Name, "Description", 30.0, -97.0, "TestCity", item.NavigationNodeId, itemTime, baseTimeStr);
            }

            // Query items using the same join pattern as DiscoveryService:
            // JOIN discovery_items with navigation_nodes to get categoryLabel
            var results = await dbContext.DiscoveryItems
                .Join(
                    dbContext.NavigationNodes,
                    di => di.NavigationNodeId,
                    nn => nn.Id,
                    (di, nn) => new { Item = di, CategoryLabel = nn.Label }
                )
                .ToListAsync();

            // Build a lookup from node ID to expected label
            var nodeLabelLookup = input.Nodes.ToDictionary(n => n.Id, n => n.Label);

            // Assert: for each returned item, categoryLabel matches the label of the linked node
            foreach (var result in results)
            {
                var expectedLabel = nodeLabelLookup[result.Item.NavigationNodeId];
                if (result.CategoryLabel != expectedLabel)
                {
                    return false; // CategoryLabel does not match the linked node's label
                }
            }

            // Also verify we got all items back
            if (results.Count != input.Items.Count)
            {
                return false;
            }

            return true;
        }
        finally
        {
            dbContext.Dispose();
            connection.Dispose();
        }
    }

    // -----------------------------------------------------------------------
    // Property 6 — Serialization round-trip
    // Validates: Requirements 9.3, 9.4
    //
    // Generates random DiscoveryItemDto objects, serializes them to JSON using
    // System.Text.Json with camelCase naming policy (same as ASP.NET Core default),
    // deserializes back to DiscoveryItemDto, and asserts all fields are equal
    // between original and deserialized object.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(DiscoveryItemDtoGenerator) })]
    public bool SerializedDto_RoundTripsCorrectly(DiscoveryItemDto dto)
    {
        // Feature: discovery-results-feed, Property 6: Serialization round-trip
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        // Serialize to JSON
        var json = JsonSerializer.Serialize(dto, options);

        // Deserialize back to DiscoveryItemDto
        var deserialized = JsonSerializer.Deserialize<DiscoveryItemDto>(json, options);

        if (deserialized == null)
            return false;

        // Assert scalar fields are equal
        if (deserialized.Id != dto.Id)
            return false;

        if (deserialized.Name != dto.Name)
            return false;

        if (deserialized.Description != dto.Description)
            return false;

        if (Math.Abs(deserialized.Latitude - dto.Latitude) > 0.0001)
            return false;

        if (Math.Abs(deserialized.Longitude - dto.Longitude) > 0.0001)
            return false;

        if (deserialized.City != dto.City)
            return false;

        if (deserialized.Address != dto.Address)
            return false;

        if (deserialized.ImageUrl != dto.ImageUrl)
            return false;

        if (deserialized.NavigationNodeId != dto.NavigationNodeId)
            return false;

        if (deserialized.CategoryLabel != dto.CategoryLabel)
            return false;

        // Handle metadata comparison: after round-trip, object? Metadata
        // becomes a JsonElement. Compare via JSON string representation.
        if (dto.Metadata == null)
        {
            if (deserialized.Metadata != null)
                return false;
        }
        else
        {
            // Serialize both metadata values to JSON strings and compare
            var originalMetadataJson = JsonSerializer.Serialize(dto.Metadata, options);
            var deserializedMetadataJson = JsonSerializer.Serialize(deserialized.Metadata, options);

            if (originalMetadataJson != deserializedMetadataJson)
                return false;
        }

        return true;
    }

    // -----------------------------------------------------------------------
    // Property 7 — Metadata JSONB storage round-trip
    // Validates: Requirements 1.4
    //
    // Generates random JSON objects (nested, arrays, strings, numbers,
    // booleans, nulls), stores them as the metadata string in a
    // DiscoveryItem, retrieves the item from the database, and asserts
    // the retrieved metadata JSON equals the original.
    // -----------------------------------------------------------------------

    [Property(MaxTest = 100, Arbitrary = new[] { typeof(MetadataJsonInputGenerator) })]
    public async Task<bool> MetadataJsonb_StoredAndRetrievedWithoutDataLoss(MetadataJsonInput input)
    {
        // Feature: discovery-results-feed, Property 7: Metadata JSONB storage round-trip
        var (dbContext, connection) = CreateSqliteDbContext();
        try
        {
            var baseTime = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
            var baseTimeStr = baseTime.ToString("yyyy-MM-dd HH:mm:ss");

            // Create a root navigation node for the item
            await dbContext.Database.ExecuteSqlRawAsync(
                "INSERT INTO navigation_nodes (id, label, icon, parent_id, sort_order, created_at, updated_at) VALUES (1, 'Root', NULL, NULL, 0, {0}, {1})",
                baseTimeStr, baseTimeStr);

            // Store a DiscoveryItem with the generated JSON as metadata
            var item = new DiscoveryItem
            {
                Id = 1,
                Name = "Test Item",
                Description = "Test Description",
                Latitude = 30.0,
                Longitude = -97.0,
                City = "TestCity",
                Address = null,
                ImageUrl = null,
                NavigationNodeId = 1,
                Metadata = input.JsonString,
                CreatedAt = new DateTimeOffset(baseTime),
                UpdatedAt = new DateTimeOffset(baseTime)
            };

            dbContext.DiscoveryItems.Add(item);
            await dbContext.SaveChangesAsync();

            // Clear the change tracker to force a fresh read from the database
            dbContext.ChangeTracker.Clear();

            // Retrieve the item from the database
            var retrieved = await dbContext.DiscoveryItems
                .AsNoTracking()
                .FirstOrDefaultAsync(di => di.Id == 1);

            if (retrieved == null)
                return false;

            if (retrieved.Metadata == null)
                return false;

            // Parse both the original and retrieved JSON and compare
            using var originalDoc = JsonDocument.Parse(input.JsonString);
            using var retrievedDoc = JsonDocument.Parse(retrieved.Metadata);

            // Compare by normalizing to canonical JSON representation
            var originalJson = JsonSerializer.Serialize(originalDoc.RootElement);
            var retrievedJson = JsonSerializer.Serialize(retrievedDoc.RootElement);

            return originalJson == retrievedJson;
        }
        finally
        {
            dbContext.Dispose();
            connection.Dispose();
        }
    }
}
