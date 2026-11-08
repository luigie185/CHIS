import { boolean, jsonb, pgTable, serial, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { vaccineCategory } from "./enums";

export const barangays = pgTable("barangays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const labTests = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export type VaccineDoseSchedule = { dose: number; ageWeeks?: number; note?: string }[];

export const vaccines = pgTable("vaccines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: vaccineCategory("category").notNull(),
  totalDoses: smallint("total_doses").notNull(),
  schedule: jsonb("schedule").$type<VaccineDoseSchedule>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
});

export const facilitySettings = pgTable("facility_settings", {
  id: smallint("id").primaryKey().default(1),
  facilityName: text("facility_name").notNull(),
  address: text("address"),
  municipality: text("municipality"),
  province: text("province"),
  logoUrl: text("logo_url"),
  reportHeader: text("report_header"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
