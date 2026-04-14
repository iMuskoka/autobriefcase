import { Html, Body, Container, Heading, Text, Hr, Section, Button } from "@react-email/components";

interface ReminderEmailProps {
  vehicleName:     string;   // e.g. "2019 Toyota Camry" or nickname
  documentType:    string;   // human-readable: "Insurance" not "insurance"
  expiryDate:      string;   // formatted: "July 1, 2026"
  daysUntilExpiry: number;   // e.g. 30
  obligationUrl?:  string;   // deep link to obligation detail page
}

export function ReminderEmail({ vehicleName, documentType, expiryDate, daysUntilExpiry, obligationUrl }: ReminderEmailProps) {
  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f9fafb", padding: "40px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "32px", maxWidth: "480px", margin: "0 auto" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>
            Renewal reminder
          </Heading>
          <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
            Your {vehicleName} {documentType} renews in {daysUntilExpiry} days.
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ fontSize: "14px", color: "#6b7280" }}>
            Renewal date: {expiryDate}
          </Text>
          {obligationUrl && (
            <Section style={{ marginTop: "24px" }}>
              <Button
                href={obligationUrl}
                style={{
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                I&apos;ve renewed this →
              </Button>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}
