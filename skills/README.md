# Skills

Reusable [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) extracted from
building Gymbar. Each one packages a method we actually use, not a prompt template.

## workout-program-builder

Builds or audits a strength-training program from bodyweight, goal, available equipment and
weekly schedule.

The interesting part is the audit method. Instead of matching exercises to muscle names, it maps
a program onto six movement patterns and looks for the empty row — which is how it catches the
hole that muscle-name thinking misses. The most common example: someone moves from a commercial
gym to a home setup, loses the leg curl machine, and trains the front of the thigh twice a week
and the back of it never. Squats and leg extensions both extend the knee; nothing flexes it.

It also refuses to invent equipment. If a movement cannot be built from what the person owns, it
says so and leaves the gap named rather than proposing an improvised fix — because a named gap is
something you can solve with a €10 ankle strap, and a fake fix is something you believe for a year.

Includes weekly set targets, rep ranges by goal, a double-progression rule with a stall protocol,
what to do when a home weight stack maxes out, and a safety pass for training alone with no
spotter.

### Install

```bash
mkdir -p ~/.claude/skills
cp -r skills/workout-program-builder ~/.claude/skills/
```

Then just describe your situation — bodyweight, goal, what equipment you have, which days you
train — and ask for a program. To audit something you already run, paste it in and ask what it is
missing.

Works in Claude Code, and the same folder can be uploaded as a Skill in the Claude apps.

### Scope

Training programming only. It will not give medical, rehabilitation, supplement or nutrition
advice, and it says so rather than improvising — pain and injury belong to a professional, not to
a program builder.
