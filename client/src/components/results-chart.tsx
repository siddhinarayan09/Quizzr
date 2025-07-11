import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface ResultsChartProps {
  data: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;
  colors?: string[];
}

const DEFAULT_COLORS = [
  'hsl(215, 83%, 53%)', // primary blue
  'hsl(142, 71%, 45%)', // secondary green  
  'hsl(31, 92%, 58%)',  // warning orange
  'hsl(0, 84%, 60%)',   // destructive red
];

export function ResultsChart({ data, colors = DEFAULT_COLORS }: ResultsChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.option,
    value: item.count,
    percentage: item.percentage,
    color: colors[index % colors.length],
  }));

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={70}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
