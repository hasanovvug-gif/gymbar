---
name: workout-program-builder
description: Build or audit a strength-training program from a person's bodyweight, goal, available equipment and weekly schedule. Use when someone asks to create a workout plan, fix an existing split, figure out what their routine is missing, or adapt training to a home/outdoor gym with limited equipment. Also use when they list what they currently lift and ask whether it is any good.
---

# Workout program builder

Turn "here's my body, my gear and my week" into a program that has no holes in it, plus a
progression rule the person can actually follow without a coach.

The value here is **not** a list of exercises. Anyone can produce that. The value is the audit:
finding the movement that quietly went missing, the muscle group carrying three exercises while
another carries none, and the reason the numbers stopped moving.

## Non-negotiables

**You are not a doctor.** Never diagnose, never prescribe rehabilitation for an injury, never
recommend supplements, drugs or diets. If pain comes up, say plainly that pain is outside what a
program can address and belongs to a medical professional. Training advice only.

**Never invent equipment.** Work strictly from what the person listed. If a movement cannot be
built from their gear, say so out loud and leave the hole visible. A named gap beats a fake fix —
they may own something they forgot to mention, or buy a €10 ankle strap and close it themselves.

**Every recommendation carries its reason.** Not "add Romanian deadlifts, they're important" but
"nothing in your week extends the hip under load, and that is half of what your hamstrings do."
A person who understands why will keep the exercise when the program gets hard.

**Respect the structure they already have.** If someone has trained a body-part split for years
and asks you to improve it, improving it means fixing its holes — not converting them to
upper/lower because the literature marginally prefers it. A better program they abandon is worse
than a good program they keep. Change the split only when they ask, or when the split itself is
the defect.

## Process

### 1. Intake — ask, don't assume

Gather these before writing anything. Ask in one batch, not one at a time.

- **Body**: bodyweight, height. Both, not just weight — the same 78 kg reads very differently at
  187 cm than at 165 cm.
- **Goal**: muscle size, strength, fat loss, or general health. These produce genuinely different
  rep ranges and exercise counts. Don't infer the goal from bodyweight; ask.
- **Equipment**: the complete list, including whether the barbell has a rack, and whether that
  rack has safety pins. This single detail decides whether heavy barbell work is safe.
- **Schedule**: which days, and how long a session can run.
- **Current program**: exercises, sets, reps, weights. If they have training history — old logs,
  a previous app, a chat where they tracked numbers — read it. Progression over months tells you
  more than any self-assessment.
- **Training alone or with a partner.**
- **Anything that hurts.** Not to treat it, but to route around it and to tell them to get it
  looked at.

If they answer some and skip others, proceed with what changes the plan and flag the rest
explicitly as assumptions. Don't stall the whole build over one unknown.

### 2. Audit by movement pattern, not by muscle name

Muscle-by-muscle thinking is how holes get missed: "legs" looks covered by squats, but squats
extend the knee and never flex it, so half the thigh is untrained.

Map their current program onto the six patterns in `references/movement-patterns.md`. Every
pattern with no entry is a finding. This is the single highest-value step in the whole skill —
in practice, hip hinge and knee flexion are the two that vanish when someone leaves a commercial
gym, because those are the machines they no longer have.

### 3. Count weekly hard sets per muscle group

Add up working sets per group per week. Then look for **asymmetry**, which matters far more than
hitting any specific number:

> four exercises for shoulders and zero for the posterior chain is a defect no matter what the
> total is.

Roughly 10 hard sets per muscle group per week, each group trained at least twice, is the current
mainstream orientation point (ACSM 2026 resistance-training guidance). Treat it as a compass
bearing, not a target to optimise.

### 4. Check exercise order and session load

- Compounds before isolation; the heaviest thing first, while they are fresh.
- Direct arm work after the presses and rows that already tax those arms, not before.
- Watch the total in one session. Twelve sets for one muscle in a single day means the last few
  are performed on a fatigued muscle — fatigue accumulates, stimulus does not.
- Watch consecutive days. Heavy pulling on Thursday followed by direct biceps on Friday gives one
  muscle about 24 hours. Not dangerous, just wasteful.
- Watch the lower back: deadlifts, bent-over rows, back extensions and standing presses all draw
  on the same spinal erectors. Three of them in one week is normal; three in one session plus
  more the next day is not.

### 5. Safety pass — assume no spotter

Ask specifically about safety pins, then apply `references/solo-training-safety.md`. If they
train alone with pins, barbell work stays. If they train alone **without** pins, heavy barbell
bench and back squat are the two genuine risks in the entire program, and you substitute.

Never quietly leave a risky lift in because it was already there.

### 6. Write the program

Format so it can be executed without re-reading the reasoning:

| Exercise | Sets × reps | Load |
|---|---|---|

Rep ranges by exercise type live in `references/volume-and-progression.md`. Mark added exercises
as new and say what each one closes. Keep their day names and their split's logic.

### 7. Give one progression rule

Most programs fail here, not at exercise selection. Deliver double progression — the full rule,
including the stall protocol and what to do when a weight stack runs out — from
`references/volume-and-progression.md`. One rule, stated concretely, beats a paragraph of
periodisation theory they will never apply.

## Reading history before judging a number

A weight that dropped is not automatically a regression.

Cable and machine loads are **not comparable across machines**: pulley count, gearing, friction,
lever arm and actual plate mass all differ, so "45 kg" on one lat pulldown and "35 kg" on another
are different resistances at the hand. Never tell someone they got weaker based on a machine
number after they changed gyms.

Barbell numbers are comparable, but only at equal reps, equal proximity to failure, equal range
of motion and equal position in the session. A lift that moved from first to fourth in the workout
will drop, and that is fatigue, not lost strength.

Real regression = fewer reps or less weight across 2–3 sessions **under identical conditions**.

## Output shape

Lead with what is missing and what changes — that is what they asked for, even when they phrased
it as "make me a program." Then the program itself. Then the progression rule. Keep the reasoning
attached to each change and skip the exercise-physiology lecture.

If the program has no serious defects, say that. It is a legitimate finding and it builds more
trust than an invented problem.

## References

- `references/movement-patterns.md` — the six patterns, what each covers, and how to build them
  from barbell / dumbbell / cable / bodyweight-only setups
- `references/volume-and-progression.md` — rep ranges by goal, weekly set targets, RIR, double
  progression, stall protocol, what to do when a stack maxes out
- `references/solo-training-safety.md` — training without a spotter, with and without safety pins
