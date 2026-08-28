# Decisions a model does not get to make

The design session is run by GLM-5.3-Flash. Some questions are not the model's to
answer, and it said so itself. Those are recorded here, with who decided and why,
before they are fed back into the session.

---

## D1. Relatives of victims may look up a specific aircraft

**Decided by:** Henk van Ess, 29 August 2026
**Raised by:** GLM-5.3-Flash, unprompted, in the prompt it wrote for itself

The model flagged this as the highest-stakes decision in the plan and declined to
make it:

> Decide explicitly whether per-tail histories should be shown to them at all,
> and under what framing.

> it's the highest-stakes design decision in the whole plan and it shouldn't be
> left to the model.

**Decision: yes. It is public record.**

The reasoning is the same one the parent tool is built on. The FAA publishes these
reports precisely so that anyone may read them. A tool that holds public records
and then decides some readers are too upset to see them has appointed itself a
gatekeeper the law did not appoint. Relatives are frequently the people who have
been refused this material elsewhere, which is the argument for showing it, not
against.

**What this does not settle.** The model's concern was never access, it was
framing. Someone reading a list of defects on the aircraft a relative died on
will see cause where the data shows none. So the design problem is now:

- A maintenance write-up is a defect that was **caught**. Every screen must carry
  that, not in a footnote.
- The dataset records no accidents and no causes. It cannot connect a defect to a
  crash, and must never appear to.
- Absence of reports is not evidence of a safe aircraft, and a long list is not
  evidence of an unsafe one.
- No codes, no jargon, no unexplained abbreviations on this surface.

That is a framing specification, and it is what the next design turn is asked to
solve.
