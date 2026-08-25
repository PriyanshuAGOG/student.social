"use client";
import Link from 'next/link';
import { AvatarStack, CtaBand, FeatureCard, Footer, Nav, Newsletter, PhoneMock, ProductMoment, SectionLabel } from './ui';

const features = [
  ['01', 'Study circles', 'Small groups built around a subject, a goal, and the energy to keep showing up.', 'terracotta'],
  ['02', 'AI tutor', 'Ask the follow-up question you were too shy to ask, then turn the answer into a study plan.', 'plum'],
  ['03', 'Goal tracking', 'Break a big syllabus into visible weekly promises and celebrate steady progress.', 'olive'],
  ['04', 'Resource vault', 'Keep the notes, links, flashcards, and explanations your circle actually uses.', 'amber'],
  ['05', 'Real-time chat', 'Move naturally from a quick question to a focused session with the people already there.', 'terracotta'],
  ['06', 'Gentle gamification', 'Streaks and milestones that encourage consistency without turning learning into a contest.', 'plum'],
] as const;

export default function LandingPage() {
  return <main className="ss-public">
    <div className="dark-shell hero-shell"><Nav />
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy"><span className="eyebrow light">STUDENT-LED · BETA PREVIEW</span><h1 id="hero-title">Learning is better <em>with people.</em></h1><p className="hero-lead">Find your people, build a study rhythm, and get unstuck with thoughtful AI support—without making learning feel lonely.</p>
          <form className="join-search" action="/register"><span aria-hidden="true">⌕</span><input aria-label="What are you learning?" name="topic" placeholder="What are you learning?" /><button>Find a circle <span aria-hidden="true">↗</span></button></form>
          <div className="topic-row" aria-label="Popular topics"><span>Python</span><span>Calculus</span><span>Product design</span><span>IELTS</span></div>
          <div className="mini-session"><div><span className="pulse" /> UP NEXT · 6:30 PM</div><strong>Calculus problem sprint</strong><p>Limits & continuity · 4 seats open</p><AvatarStack /></div>
        </div>
        <div className="phone-stage"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><PhoneMock /><div className="floating-note note-one"><b>14 day</b><span>study rhythm</span></div><div className="floating-note note-two"><span>NEW RESOURCE</span><b>Vector notes.pdf</b></div></div>
        <aside className="circle-column" aria-label="Active circles"><div className="circle-card paper-card"><div className="card-heading"><span>Active circles</span><span className="live-dot">3 LIVE</span></div><div className="circle-item"><i className="dot terracotta" /><div><b>Python beginners</b><span>12 learning now</span></div><span>→</span></div><div className="circle-item"><i className="dot olive" /><div><b>Organic chemistry</b><span>8 sharing notes</span></div><span>→</span></div><div className="circle-item"><i className="dot plum" /><div><b>Portfolio studio</b><span>6 giving feedback</span></div><span>→</span></div><Link href="/register" className="text-link">Explore every circle ↗</Link></div><blockquote className="hand-note">“I stopped waiting to feel motivated. The circle was already there.”<cite>— Arjun, product UI example</cite></blockquote><div className="resource-stack"><span className="resource-tab olive-bg">SHARED</span><b>3 resources added today</b><p>Flashcards · recap · worked example</p></div></aside>
      </section>
      <div className="value-strip container" aria-label="Product values"><div><b>BETA</b><span>Honest preview</span></div><div><b>FREE</b><span>Explore the idea</span></div><div><b>AI</b><span>Study support</span></div><div><b>PEOPLE</b><span>Collaborative circles</span></div></div>
    </div>

    <section className="cream-zone accountability" id="how-it-works"><div className="container"><SectionLabel number="01" label="A better study rhythm" /><div className="section-heading split-heading"><div><h2>Accountability that feels <em>human.</em></h2><p>Small promises are easier to keep when someone notices.</p></div><Link className="text-link dark" href="/demo">See the product tour ↗</Link></div><div className="account-grid">
      <div className="week-card tactile-card"><div className="card-heading"><span>THIS WEEK</span><span>72% COMPLETE</span></div><h3>Three focused sessions.<br />One calmer Friday.</h3><div className="days"><span className="done">M</span><span className="done">T</span><span className="today">W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div className="promise"><i className="avatar avatar-rust">AM</i><div><b>Aarav finished “Limits practice”</b><span>Cheer sent by 4 circle mates</span></div><span>♥</span></div><div className="progress"><span style={{width:'72%'}} /></div></div>
      <div className="connector-copy"><span className="step-number">01</span><h3>Choose a subject</h3><p>Search a topic and find a small group moving at your pace.</p><span className="step-number">02</span><h3>Make one promise</h3><p>Pick the next useful thing—not an impossible master plan.</p><span className="step-number">03</span><h3>Show up together</h3><p>Study, share, ask, and notice the quiet progress.</p></div>
      <div className="session-card tactile-card"><span className="eyebrow">UPCOMING SESSION</span><h3>Python practice room</h3><p>Lists, loops & one stubborn bug</p><div className="session-meta"><b>Today · 7:00 PM</b><span>45 min</span></div><AvatarStack /><button className="dark-button">Join the room →</button></div>
    </div></div></section>

    <section className="ai-zone" id="ai-tutor"><div className="container ai-layout"><div className="ai-copy"><SectionLabel number="02" label="AI that teaches back" /><h2>Get an explanation.<br /><em>Keep your agency.</em></h2><p>Student.social’s tutor is designed to reveal the next step, not quietly replace the work. Ask for a hint, a simpler analogy, or a tiny practice set.</p><Link className="button rust" href="/demo">Meet the AI tutor →</Link></div><div className="tutor-card tactile-card"><div className="tutor-head"><span className="spark">✦</span><div><b>Tutor</b><span>Explains · checks · nudges</span></div><span className="preview-pill">PREVIEW</span></div><div className="chat user-chat">Why does the derivative become zero here?</div><div className="chat ai-chat"><b>Let’s picture the graph.</b><p>At the turning point, the curve is momentarily flat. A flat tangent has slope zero. Want to test that idea on a nearby example?</p><div className="hint-actions"><span>Show me visually</span><span>Give me a hint</span></div></div><div className="composer"><span>Ask a follow-up…</span><b>↑</b></div></div></div></section>

    <section className="features-zone" id="features"><div className="container"><SectionLabel number="03" label="The whole learning loop" /><div className="section-heading"><h2>Everything you need to <em>excel.</em></h2><p>Useful tools, arranged around a simple truth: students learn best when support is easy to reach.</p></div><div className="feature-grid">{features.map(([n,t,d,c]) => <FeatureCard key={n} number={n} title={t} text={d} accent={c} />)}</div></div></section>
    <section className="moments-zone" id="community"><div className="container"><SectionLabel number="04" label="Product moments" /><div className="section-heading split-heading"><div><h2>A social layer for the <em>messy middle.</em></h2><p>These are interface examples—not customer testimonials—showing how support might surface at the exact moment it matters.</p></div></div><div className="moments-grid"><ProductMoment label="A question becomes a session" title="Can someone explain recursion without saying ‘recursion’?" meta="4 replies · Python beginners" accent="terracotta" /><ProductMoment label="A resource finds its people" title="Maya shared: Visual guide to electrochemistry" meta="Saved by 7 circle mates" accent="olive" /><ProductMoment label="Progress gets noticed" title="Noah completed a third focus session this week" meta="5 quiet cheers" accent="plum" /></div></div></section>
    <CtaBand /><Newsletter /><Footer />
  </main>;
}


