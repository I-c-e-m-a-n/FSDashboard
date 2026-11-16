import { test, expect } from "@playwright/test";
import {
  categories,
  records,
  filterRecords,
  isOutstanding,
  isOverdue,
} from "../src/data";
test("synthetic dataset has consistent totals and inclusive date filters", () => {
  expect(new Set(records.map((r) => r.id)).size).toBe(records.length);
  const base = {
    sector: "All areas",
    days: 30,
    query: "",
    categories: [...categories],
  };
  const all = filterRecords(base);
  expect(all).toHaveLength(16);
  expect(all.filter(isOutstanding)).toHaveLength(6);
  expect(all.filter(isOverdue)).toHaveLength(2);
  const recent = filterRecords({ ...base, days: 7 });
  expect(recent).toHaveLength(8);
  expect(recent.every((r) => r.date >= "2026-11-10")).toBe(true);
  expect(
    all
      .filter((r) => r.category === "House visits")
      .reduce((sum, r) => sum + r.units, 0),
  ).toBe(146);
  expect(
    all
      .filter((r) => r.category === "Engagements")
      .reduce((sum, r) => sum + r.units, 0),
  ).toBe(119);
  expect(filterRecords({ ...base, query: "  FS-001  " })).toHaveLength(1);
  expect(filterRecords({ ...base, categories: [] })).toHaveLength(0);
});
