import { describe, it, expect } from "vitest";
import { vehicleSchema } from "./vehicle";

const currentYear = new Date().getFullYear();

const validVehicle = {
  category: "car" as const,
  make: "Tesla",
  model: "Model 3",
  year: 2024,
  nickname: "Daily Driver",
  notes: "Registered in NY",
};

describe("vehicleSchema", () => {
  describe("valid data", () => {
    it("accepts a fully valid vehicle object", () => {
      const result = vehicleSchema.safeParse(validVehicle);
      expect(result.success).toBe(true);
    });

    it("accepts all 7 valid category values", () => {
      const categories = [
        "car", "motorcycle", "boat", "pwc",
        "snowmobile", "atv", "seasonal_pass",
      ] as const;
      for (const category of categories) {
        const result = vehicleSchema.safeParse({ ...validVehicle, category });
        expect(result.success, `category "${category}" should be valid`).toBe(true);
      }
    });

    it("accepts optional fields when omitted", () => {
      const { nickname, notes, ...required } = validVehicle;
      const result = vehicleSchema.safeParse(required);
      expect(result.success).toBe(true);
    });

    it("accepts optional fields as empty strings", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        nickname: "",
        notes: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts year = 1900 (minimum)", () => {
      const result = vehicleSchema.safeParse({ ...validVehicle, year: 1900 });
      expect(result.success).toBe(true);
    });

    it("accepts year = currentYear + 1 (maximum)", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        year: currentYear + 1,
      });
      expect(result.success).toBe(true);
    });

    it("rejects year as a string (no coercion — valueAsNumber: true handles this at the form level)", () => {
      const result = vehicleSchema.safeParse({ ...validVehicle, year: "2022" });
      expect(result.success).toBe(false);
    });
  });

  describe("required field validation", () => {
    it("rejects missing category", () => {
      const { category, ...rest } = validVehicle;
      const result = vehicleSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it("rejects invalid category value", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        category: "truck",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty make with correct message", () => {
      const result = vehicleSchema.safeParse({ ...validVehicle, make: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Make is required");
      }
    });

    it("rejects empty model with correct message", () => {
      const result = vehicleSchema.safeParse({ ...validVehicle, model: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Model is required");
      }
    });
  });

  describe("year validation", () => {
    it("rejects year = 1899 (below minimum)", () => {
      const result = vehicleSchema.safeParse({ ...validVehicle, year: 1899 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Year must be 1900 or later");
      }
    });

    it("rejects year = currentYear + 2 (above maximum)", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        year: currentYear + 2,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer year", () => {
      const result = vehicleSchema.safeParse({ ...validVehicle, year: 2024.5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Year must be a whole number");
      }
    });
  });

  describe("optional field length limits", () => {
    it("rejects nickname over 100 characters", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        nickname: "a".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Nickname must be 100 characters or less",
        );
      }
    });

    it("accepts nickname of exactly 100 characters", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        nickname: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("rejects notes over 500 characters", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        notes: "a".repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Notes must be 500 characters or less",
        );
      }
    });

    it("accepts notes of exactly 500 characters", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        notes: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("rejects make over 100 characters", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        make: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("rejects model over 100 characters", () => {
      const result = vehicleSchema.safeParse({
        ...validVehicle,
        model: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });
});
