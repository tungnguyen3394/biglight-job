"use client";

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const RED = "#D02E26";
const AMBER = "#E8810C";
const GREEN = "#1F9D55";

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#9AA2AE", font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: "#F1F3F5" }, ticks: { color: "#9AA2AE", font: { size: 10 }, precision: 0 } },
  },
} as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="h-56">{children}</div>
    </div>
  );
}

export function DashboardCharts({
  trend, jobStatus, hiring,
}: {
  trend: { labels: string[]; data: number[] };
  jobStatus: { labels: string[]; data: number[] };
  hiring: { labels: string[]; data: number[] };
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="応募者トレンド（過去14日）">
          <Line
            data={{
              labels: trend.labels,
              datasets: [{
                data: trend.data, borderColor: RED, backgroundColor: "rgba(208,46,38,0.08)",
                fill: true, tension: 0.35, pointRadius: 2, pointBackgroundColor: RED, borderWidth: 2,
              }],
            }}
            options={baseOpts as never}
          />
        </Card>
      </div>
      <Card title="求人ステータス">
        <Doughnut
          data={{
            labels: jobStatus.labels,
            datasets: [{ data: jobStatus.data, backgroundColor: [GREEN, AMBER, RED, "#CBD5E1"], borderWidth: 0 }],
          }}
          options={{ responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { color: "#5B6472", font: { size: 11 }, boxWidth: 10, padding: 12 } } } } as never}
        />
      </Card>
      <div className="lg:col-span-3">
        <Card title="月次入社（過去6ヶ月）">
          <Bar
            data={{
              labels: hiring.labels,
              datasets: [{ data: hiring.data, backgroundColor: GREEN, borderRadius: 6, barThickness: 28 }],
            }}
            options={baseOpts as never}
          />
        </Card>
      </div>
    </div>
  );
}
