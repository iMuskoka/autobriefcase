import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "../auth";

describe("signUpSchema", () => {
  it("accepts valid email, password ≥ 8 chars, and matching confirmPassword", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Enter a valid email address");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Password must be at least 8 characters");
  });

  it("rejects mismatched passwords and targets confirmPassword path", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different456",
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) =>
      i.path.includes("confirmPassword"),
    );
    expect(issue?.message).toBe("Passwords do not match");
  });

  it("rejects an empty email", () => {
    const result = signUpSchema.safeParse({
      email: "",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an exactly 8-character password", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "exactly8",
      confirmPassword: "exactly8",
    });
    expect(result.success).toBe(true);
  });
});

describe("signInSchema", () => {
  it("accepts a valid email and password", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Enter a valid email address");
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Password is required");
  });

  it("rejects an empty email", () => {
    const result = signInSchema.safeParse({
      email: "",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a password shorter than 8 characters (no length constraint on sign-in)", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email address", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Enter a valid email address");
  });

  it("rejects an empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  it("accepts a valid password ≥ 8 chars with matching confirm", () => {
    const result = updatePasswordSchema.safeParse({
      password: "newpassword1",
      confirmPassword: "newpassword1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = updatePasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Password must be at least 8 characters");
  });

  it("rejects mismatched passwords and targets confirmPassword path", () => {
    const result = updatePasswordSchema.safeParse({
      password: "newpassword1",
      confirmPassword: "different456",
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) =>
      i.path.includes("confirmPassword"),
    );
    expect(issue?.message).toBe("Passwords do not match");
  });

  it("accepts an exactly 8-character password", () => {
    const result = updatePasswordSchema.safeParse({
      password: "exactly8",
      confirmPassword: "exactly8",
    });
    expect(result.success).toBe(true);
  });
});
