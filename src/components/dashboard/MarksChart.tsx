'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Mark } from '@/types';

export default function MarksChart({ data }: { data: Mark[] }) {
  const chartData = data.map(d => ({
    name: d.assessment,
    percentage: (d.score / d.total) * 100,
  }));

  const chartConfig = {
    percentage: {
      label: 'Percentage',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={value => `${value}%`}
          />
          <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <Line
            dataKey="percentage"
            type="monotone"
            stroke="var(--color-percentage)"
            strokeWidth={2}
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
