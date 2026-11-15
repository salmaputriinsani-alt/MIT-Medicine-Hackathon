import React from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#0D9488',
}) => {
  if (!data || data.length < 2) {
    return <div className="h-8 w-20" />;
  }
  const chartData = data.map((v, idx) => ({ idx, v }));

  return (
    <div className="h-8 w-20 shrink-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
