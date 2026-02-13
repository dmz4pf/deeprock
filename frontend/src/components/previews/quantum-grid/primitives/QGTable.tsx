"use client";

import React from "react";

interface QGTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: any) => React.ReactNode;
}

interface QGTableProps {
  columns: QGTableColumn[];
  data: Record<string, any>[];
  onRowClick?: (row: any) => void;
}

const ALIGN_CLASSES = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function QGTable({ columns, data, onRowClick }: QGTableProps) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`
                  px-3 py-2 text-[11px] tracking-[0.15em] uppercase text-[#5A5347]
                  font-medium border-b border-[var(--border-default)]
                  ${ALIGN_CLASSES[col.align || "left"]}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`
                row-hover
                ${onRowClick ? "cursor-pointer" : ""}
                ${i % 2 === 0 ? "bg-[rgba(232,180,184,0.01)]" : "bg-transparent"}
              `}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`
                    px-3 py-2.5 text-sm text-[#B8A99A]
                    border-b border-[rgba(232,180,184,0.03)]
                    ${ALIGN_CLASSES[col.align || "left"]}
                  `}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
