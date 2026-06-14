import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';

export default function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <View style={styles.container}>
      <Svg width={140} height={140} viewBox="0 0 140 140">
        {data.map((item, index) => {
          const percent = item.value / total;
          const strokeDasharray = circumference * percent;
          const strokeDashoffset = -cumulativePercent * circumference;
          cumulativePercent += percent;

          return (
            <Circle
              key={index}
              cx="70"
              cy="70"
              r={radius}
              stroke={COLORS.chartColors[index % COLORS.chartColors.length]}
              strokeWidth={30}
              fill="none"
              strokeDasharray={`${strokeDasharray} ${circumference - strokeDasharray}`}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          );
        })}
        <Circle cx="70" cy="70" r={45} fill="#fff" />
      </Svg>

      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.chartColors[index % COLORS.chartColors.length] }]} />
            <Text style={styles.legendText}>
              {item.label} ({(item.value / total * 100).toFixed(0)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    marginTop: 12,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
