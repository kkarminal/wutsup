import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/colors';
import { HoursDisplay } from '@/components/HoursDisplay';
import { BusyTimesChart } from '@/components/BusyTimesChart';
import type { HoursData, BusyTimesData } from '@/services/discoveryApi';

interface LocationTabContentProps {
  latitude: number;
  longitude: number;
  address: string | null;
  city: string;
  hours: HoursData | null;
  busyTimes: BusyTimesData | null;
}

/**
 * Content panel for the "Location" tab in the expanded card detail view.
 * Displays a map centered on the item's coordinates, address, city,
 * operating hours, and busy times chart.
 */
export function LocationTabContent({
  latitude,
  longitude,
  address,
  city,
  hours,
  busyTimes,
}: LocationTabContentProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={{ latitude, longitude }} />
        </MapView>
      </View>

      {/* Address and city */}
      <View style={styles.addressSection}>
        {address && (
          <Text style={[styles.address, { color: theme.textPrimary }]}>{address}</Text>
        )}
        <Text style={[styles.city, { color: theme.textSecondary }]}>{city}</Text>
      </View>

      {/* Hours */}
      {hours && <HoursDisplay hours={hours} />}

      {/* Busy times */}
      {busyTimes && <BusyTimesChart busyTimes={busyTimes} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  mapContainer: {
    height: 180,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  addressSection: {
    gap: SPACING.xs,
  },
  address: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  city: {
    fontSize: FONT_SIZE.sm,
  },
});
