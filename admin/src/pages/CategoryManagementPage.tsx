import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '../contexts/AuthContext'
import {
  ApiError,
  getNavigationTree,
  updateNavigationNode,
} from '../services/apiClient'
import type { NavigationNodeDto } from '../services/apiClient'

interface FlatNode {
  id: number
  label: string
  icon: string | null
  backgroundImageUrl: string | null
}

function flattenTree(nodes: NavigationNodeDto[]): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      label: node.label,
      icon: node.icon,
      backgroundImageUrl: node.backgroundImageUrl,
    })
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

export function CategoryManagementPage() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  const [nodes, setNodes] = useState<FlatNode[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Edit dialog state
  const [editNode, setEditNode] = useState<FlatNode | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const fetchNodes = useCallback(async () => {
    if (!auth.token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setFetchError(null)

    try {
      const tree = await getNavigationTree(auth.token)
      setNodes(flattenTree(tree))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login')
        return
      }
      setFetchError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [auth.token, logout, navigate])

  useEffect(() => {
    void fetchNodes()
  }, [fetchNodes])

  function handleEditOpen(node: FlatNode) {
    setEditNode(node)
    setEditUrl(node.backgroundImageUrl ?? '')
  }

  function handleEditClose() {
    setEditNode(null)
    setEditUrl('')
  }

  function handleClear() {
    setEditUrl('')
  }

  async function handleSave() {
    if (!editNode || !auth.token) return

    setSaving(true)

    const urlToSave = editUrl.trim() === '' ? null : editUrl.trim()

    try {
      await updateNavigationNode(auth.token, editNode.id, {
        backgroundImageUrl: urlToSave,
        updateBackgroundImageUrl: true,
      })

      // Update local state on success
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editNode.id ? { ...n, backgroundImageUrl: urlToSave } : n
        )
      )
      handleEditClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login')
        return
      }
      // Show error snackbar and retain previous value
      const message = err instanceof Error ? err.message : 'Failed to update category'
      setSnackbarMessage(message)
      setSnackbarOpen(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (fetchError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {fetchError}
        </Typography>
        <Button variant="contained" onClick={() => void fetchNodes()}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Category Background Images
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Background Image URL</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell>{node.label}</TableCell>
                <TableCell>{node.icon ?? '—'}</TableCell>
                <TableCell>
                  {node.backgroundImageUrl ? (
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {node.backgroundImageUrl}
                    </Typography>
                  ) : (
                    <Chip label="None" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleEditOpen(node)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editNode !== null} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Background Image URL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editNode?.label}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Background Image URL"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={saving}
          />
          <Button
            size="small"
            color="secondary"
            onClick={handleClear}
            disabled={saving || editUrl === ''}
            sx={{ mt: 1 }}
          >
            Clear
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error" variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
