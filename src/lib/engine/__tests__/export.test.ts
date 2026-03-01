import { describe, it, expect } from "vitest";
import { generateZWO } from "../export/zwo-generator";
import { generateMRC, generateERG } from "../export/mrc-generator";
import { generateICSEvent, generateICSCalendar } from "../export/ics-generator";
import type { CalendarEvent } from "../export/ics-generator";
import { convertToFITSteps, generateFITWorkoutJSON } from "../export/fit-generator";
import type { WorkoutInterval } from "@/lib/db/schema/training";

const simpleStructure: WorkoutInterval[] = [
  { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
  { type: "work", durationSeconds: 1200, powerTargetPctFtp: 1.0, notes: "At FTP" },
  { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.5 },
];

const intervalStructure: WorkoutInterval[] = [
  { type: "warmup", durationSeconds: 600, powerTargetPctFtp: 0.55 },
  {
    type: "work",
    durationSeconds: 240,
    powerTargetPctFtp: 1.15,
    repeat: 5,
    intervals: [
      { type: "work", durationSeconds: 240, powerTargetPctFtp: 1.15, notes: "Hard" },
      { type: "rest", durationSeconds: 180, powerTargetPctFtp: 0.45 },
    ],
  },
  { type: "cooldown", durationSeconds: 600, powerTargetPctFtp: 0.5 },
];

// ============ ZWO GENERATOR ============

describe("ZWO Generator", () => {
  it("generates valid XML with workout_file root", () => {
    const zwo = generateZWO("Test Workout", "A test workout", simpleStructure);
    expect(zwo).toContain("<?xml");
    expect(zwo).toContain("<workout_file>");
    expect(zwo).toContain("</workout_file>");
  });

  it("includes workout name and description", () => {
    const zwo = generateZWO("My Ride", "Threshold intervals", simpleStructure);
    expect(zwo).toContain("My Ride");
    expect(zwo).toContain("Threshold intervals");
  });

  it("generates Warmup element for warmup interval", () => {
    const zwo = generateZWO("Test", "Test", simpleStructure);
    expect(zwo).toContain("<Warmup");
    expect(zwo).toContain('Duration="600"');
  });

  it("generates SteadyState for work intervals", () => {
    const zwo = generateZWO("Test", "Test", simpleStructure);
    expect(zwo).toContain("<SteadyState");
    expect(zwo).toContain('Power="1"');
  });

  it("generates Cooldown element", () => {
    const zwo = generateZWO("Test", "Test", simpleStructure);
    expect(zwo).toContain("<Cooldown");
  });

  it("generates IntervalsT for repeated blocks", () => {
    const zwo = generateZWO("VO2max", "5x4min", intervalStructure);
    expect(zwo).toContain("<IntervalsT");
    expect(zwo).toContain('Repeat="5"');
    expect(zwo).toContain('OnDuration="240"');
    expect(zwo).toContain('OffDuration="180"');
  });

  it("includes text events for notes", () => {
    const zwo = generateZWO("Test", "Test", simpleStructure);
    expect(zwo).toContain("<textevent");
    expect(zwo).toContain("At FTP");
  });

  it("escapes XML special characters", () => {
    const zwo = generateZWO("Test <&>", 'Desc "quoted"', simpleStructure);
    expect(zwo).toContain("&lt;");
    expect(zwo).toContain("&amp;");
    expect(zwo).toContain("&quot;");
  });

  it("sets sportType to bike", () => {
    const zwo = generateZWO("Test", "Test", simpleStructure);
    expect(zwo).toContain("<sportType>bike</sportType>");
  });
});

// ============ MRC GENERATOR ============

describe("MRC Generator", () => {
  it("generates MRC with correct header sections", () => {
    const mrc = generateMRC("Test", "A test", simpleStructure);
    expect(mrc).toContain("[COURSE HEADER]");
    expect(mrc).toContain("[END COURSE HEADER]");
    expect(mrc).toContain("[COURSE DATA]");
    expect(mrc).toContain("[END COURSE DATA]");
  });

  it("uses MINUTES PERCENT format", () => {
    const mrc = generateMRC("Test", "Test", simpleStructure);
    expect(mrc).toContain("MINUTES PERCENT");
  });

  it("includes file name and description", () => {
    const mrc = generateMRC("My Workout", "Sweet spot", simpleStructure);
    expect(mrc).toContain("FILE NAME = My Workout");
    expect(mrc).toContain("DESCRIPTION = Sweet spot");
  });

  it("data lines have time and power values", () => {
    const mrc = generateMRC("Test", "Test", simpleStructure);
    // First line should start at 0.00
    expect(mrc).toContain("0.00\t");
  });
});

// ============ ERG GENERATOR ============

describe("ERG Generator", () => {
  it("uses MINUTES WATTS format", () => {
    const erg = generateERG("Test", "Test", simpleStructure, 250);
    expect(erg).toContain("MINUTES WATTS");
  });

  it("includes FTP in header", () => {
    const erg = generateERG("Test", "Test", simpleStructure, 250);
    expect(erg).toContain("FTP = 250");
  });

  it("converts pct FTP to absolute watts", () => {
    const erg = generateERG("Test", "Test", simpleStructure, 250);
    // 100% FTP = 250 watts
    expect(erg).toContain("\t250");
    // Warmup at 55% FTP = 138 watts
    expect(erg).toContain("\t138");
  });
});

// ============ ICS GENERATOR ============

describe("ICS Generator", () => {
  const event: CalendarEvent = {
    uid: "test-uid-123",
    title: "Threshold Ride",
    description: "2x20min at FTP",
    startDate: new Date("2026-03-15T08:00:00Z"),
    durationMinutes: 70,
    sport: "cycling",
  };

  it("generates valid VCALENDAR structure", () => {
    const ics = generateICSEvent(event);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes event details", () => {
    const ics = generateICSEvent(event);
    expect(ics).toContain("UID:test-uid-123");
    expect(ics).toContain("SUMMARY:Threshold Ride");
    expect(ics).toContain("CATEGORIES:CYCLING,TRAINING");
  });

  it("formats dates as ICS date-time", () => {
    const ics = generateICSEvent(event);
    // ISO format without dashes/colons: 20260315T080000Z
    expect(ics).toContain("DTSTART:20260315T080000Z");
  });

  it("calculates correct end time", () => {
    const ics = generateICSEvent(event);
    // 08:00 + 70min = 09:10
    expect(ics).toContain("DTEND:20260315T091000Z");
  });

  it("escapes special ICS characters", () => {
    const specialEvent: CalendarEvent = {
      ...event,
      description: "Hard; very, hard\nnew line",
    };
    const ics = generateICSEvent(specialEvent);
    expect(ics).toContain("\\;");
    expect(ics).toContain("\\,");
    expect(ics).toContain("\\n");
  });
});

describe("ICS Calendar (multiple events)", () => {
  it("generates calendar with multiple events", () => {
    const events: CalendarEvent[] = [
      {
        uid: "e1",
        title: "Morning Ride",
        description: "Easy",
        startDate: new Date("2026-03-15T08:00:00Z"),
        durationMinutes: 60,
        sport: "cycling",
      },
      {
        uid: "e2",
        title: "Afternoon Run",
        description: "Tempo",
        startDate: new Date("2026-03-15T17:00:00Z"),
        durationMinutes: 45,
        sport: "running",
      },
    ];
    const ics = generateICSCalendar(events, "My Training");
    expect(ics).toContain("X-WR-CALNAME:My Training");
    // Should have 2 VEVENT blocks
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(2);
  });
});

// ============ FIT GENERATOR ============

describe("FIT Step Converter", () => {
  it("converts simple structure to FIT steps", () => {
    const steps = convertToFITSteps(simpleStructure, 250);
    expect(steps).toHaveLength(3);
    expect(steps[0].intensity).toBe("warmup");
    expect(steps[1].intensity).toBe("active");
    expect(steps[2].intensity).toBe("cooldown");
  });

  it("sets duration in milliseconds", () => {
    const steps = convertToFITSteps(simpleStructure, 250);
    expect(steps[0].durationValue).toBe(600000); // 600s × 1000
  });

  it("sets power targets from FTP", () => {
    const steps = convertToFITSteps(simpleStructure, 250);
    // Work interval at 100% FTP = 250W
    expect(steps[1].targetType).toBe("power");
    expect(steps[1].targetValue).toBe(250);
  });

  it("flattens repeated intervals", () => {
    const steps = convertToFITSteps(intervalStructure, 250);
    // 1 warmup + 5×(work + rest) + 1 cooldown = 12 steps
    expect(steps).toHaveLength(12);
  });

  it("sets correct intensity for rest intervals", () => {
    const steps = convertToFITSteps(intervalStructure, 250);
    // After warmup, alternating active/rest
    expect(steps[2].intensity).toBe("rest");
  });

  it("increments messageIndex sequentially", () => {
    const steps = convertToFITSteps(simpleStructure, 250);
    steps.forEach((step, i) => {
      expect(step.messageIndex).toBe(i);
    });
  });
});

describe("FIT Workout JSON", () => {
  it("generates complete workout JSON", () => {
    const json = generateFITWorkoutJSON("Test Ride", "cycling", simpleStructure, 250);
    expect(json.fileType).toBe("workout");
    expect(json.workout.workoutName).toBe("Test Ride");
    expect(json.workout.sport).toBe("cycling");
    expect(json.workoutSteps).toHaveLength(3);
  });

  it("maps sport types correctly", () => {
    const cycling = generateFITWorkoutJSON("Test", "cycling", simpleStructure);
    expect(cycling.workout.sport).toBe("cycling");

    const running = generateFITWorkoutJSON("Test", "running", simpleStructure);
    expect(running.workout.sport).toBe("running");

    const swimming = generateFITWorkoutJSON("Test", "swimming", simpleStructure);
    expect(swimming.workout.sport).toBe("swimming");
  });
});
