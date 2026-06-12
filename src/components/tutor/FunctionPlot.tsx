import { useMemo } from "react";
import { evaluate } from "mathjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Props = {
  expression: string;
  xMin: number;
  xMax: number;
  label: string;
};

export function FunctionPlot({ expression, xMin, xMax, label }: Props) {
  const { data, error } = useMemo(() => {
    try {
      const min = Number.isFinite(xMin) ? xMin : -10;
      const max = Number.isFinite(xMax) ? xMax : 10;
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      const steps = 120;
      const step = (hi - lo) / steps;
      const points: { x: number; y: number | null }[] = [];
      for (let i = 0; i <= steps; i++) {
        const x = lo + i * step;
        let y: number | null = null;
        try {
          const v = evaluate(expression, { x });
          if (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e6) y = v;
        } catch {
          y = null;
        }
        points.push({ x: Number(x.toFixed(4)), y });
      }
      return { data: points, error: null as string | null };
    } catch (e) {
      return { data: [], error: e instanceof Error ? e.message : "Ugyldig uttrykk" };
    }
  }, [expression, xMin, xMax]);

  return (
    <div className="rounded-xl border border-emerald-200/60 bg-white/80 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-emerald-900">{label}</span>
        <code className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
          y = {expression}
        </code>
      </div>
      {error ? (
        <p className="text-xs text-red-600">Kunne ikke plotte: {error}</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#d1fae5" strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 11, fill: "#065f46" }}
                stroke="#a7f3d0"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#065f46" }}
                stroke="#a7f3d0"
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #a7f3d0",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [v?.toFixed?.(3), "y"]}
                labelFormatter={(l) => `x = ${l}`}
              />
              <ReferenceLine y={0} stroke="#10b981" strokeOpacity={0.4} />
              <ReferenceLine x={0} stroke="#10b981" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
