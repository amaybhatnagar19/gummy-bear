import { BrandLogo } from '../../components/BrandLogo';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { SectionHeading } from '../../components/ui/SectionHeading';
import ProductDemo from './ProductDemo';
import '../../styles/tokens.css';
import './landing.css';

// Small decorative cues reinforce the nearby text without adding controls.
function SectionIcon({ kind }: { kind: 'photo' | 'age' | 'play' | 'fresh' | 'details' | 'choice' }) {
  const paths = {
    photo: <><path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/></>,
    age: <><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M8 3v6m8-6v6M4 11h16m-12 4h3m2 0h3"/></>,
    play: <><path d="M6 20V4l13 5-13 5"/></>,
    fresh: <><path d="M19 8a8 8 0 1 0 1 7M19 3v5h-5"/></>,
    details: <><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6m-6 4h6m-6 4h4"/></>,
    choice: <><path d="m5 12 4 4L19 6"/><path d="M20 13v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h6"/></>,
  };
  return <svg className="gb-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[kind]}</svg>;
}

const questions = [
  ['What can I try today?', 'Choose one toy photo and an age from 2 to 8. The app identifies visible toys and offers up to three play ideas. It may show fewer when suitable ideas are limited. Separate recognition correction, saved toys and activity history are planned.'],
  ['Do I need to download anything?', 'No. You can try Gummy Bear in your browser. Installation as a home-screen app is planned.'],
  ['Do I need an account?', 'You can start with two free guest turns. Continuing requires an account and access under the existing plan. The app uses email and password today.'],
  ['What does continued access cost?', 'Continued access is ₹99 a month, paid manually by UPI. Access opens after the owner confirms payment. There is no automatic charge or renewal. An eligible new account can claim one final free turn.'],
  ['What happens to my photo?', 'Your browser reduces your selected photo before sending it for AI analysis. You choose the photo; the app does not request unrestricted photo-library access. Avoid faces and unrelated family details.'],
  ['How should I check an activity?', 'Read the whole idea first and use your judgment about your child and toy. Stay close, check the toy’s condition and age suitability, and skip anything that does not feel appropriate. A photo cannot verify a toy’s safety.'],
];

export default function LandingPage() {
  return <div className="gb-landing">
    <a className="gb-skip" href="#main-content">Skip to content</a>
    <header className="gb-header gb-container"><BrandLogo/><nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#privacy">Your privacy</a><ButtonLink href="/app">Get Started</ButtonLink></nav></header>
    <main id="main-content" tabIndex={-1}>
      <section className="gb-hero gb-container" aria-labelledby="hero-heading">
        <div className="gb-hero-copy"><h1 id="hero-heading">Their next favorite toy is <span>already at home.</span></h1><p>Discover fresh ways to play with the toys your child already owns. Choose a photo and get practical ideas for their age.</p><div className="gb-actions"><ButtonLink href="/app">Get Started</ButtonLink><ButtonLink href="#how-it-works" secondary>See how it works</ButtonLink></div><p className="gb-small">No download needed to try it. Two free guest turns.</p></div>
        <ProductDemo/>
      </section>
      <section className="gb-section gb-container" id="how-it-works" aria-labelledby="steps-heading">
        <SectionHeading id="steps-heading" title="From familiar toys to fresh ideas.">A photo, your child’s age, and a little imagination.</SectionHeading>
        <ol className="gb-steps"><li><span className="gb-step-number">1</span><span className="gb-step-cue"><SectionIcon kind="photo"/></span><h3>Choose a toy photo</h3><p>Take a photo or choose one from your device. Just the toys. No faces needed.</p></li><li><span className="gb-step-number">2</span><span className="gb-step-cue"><SectionIcon kind="age"/></span><h3>Choose their age</h3><p>Pick an age from 2 to 8 so the ideas have your child in mind.</p></li><li><span className="gb-step-number">3</span><span className="gb-step-cue"><SectionIcon kind="play"/></span><h3>Find a way to play</h3><p>Read the toy names and ideas together. Choose what fits your day.</p></li></ol>
        <p className="gb-small gb-planned-note">Coming next: check and correct recognized toys before generating ideas, as shown in the preview above.</p>
      </section>
      <section className="gb-example-section" aria-labelledby="example-heading"><div className="gb-container gb-example-layout">
        <div><SectionHeading id="example-heading" title="A small idea. A whole new story.">Practical play starts with what you already have.</SectionHeading><p className="gb-example-context">An illustrative example for age 4. Read each idea and decide whether it fits your child.</p></div>
        <article className="gb-example"><div className="gb-example-top"><span className="gb-category">Play Together</span><span>About 10 minutes</span></div><h3>Teddy’s little adventure</h3><p className="gb-example-summary">Turn a familiar teddy into the hero of a story you make together.</p><dl><div><dt>What you’ll need</dt><dd>One intact, age-appropriate teddy bear.</dd></div><div><dt>How to play</dt><dd><ol><li>Ask your child where Teddy would like to go.</li><li>Take turns adding one thing Teddy sees or does.</li><li>Choose how Teddy’s adventure ends.</li></ol></dd></div><div><dt>Your role</dt><dd>Join in, follow their ideas, and stay with your child.</dd></div><div><dt>A note on safety</dt><dd>Check for loose parts or damaged seams before play. Keep the story at floor level.</dd></div></dl><p className="gb-small">Example only — not a live AI result.</p></article>
      </div></section>
      <section className="gb-section gb-container" aria-labelledby="benefits-heading"><SectionHeading id="benefits-heading" title="More play. Less guesswork.">Make more of the toys you own.</SectionHeading><div className="gb-benefits"><div><span className="gb-benefit-cue"><SectionIcon kind="fresh"/></span><h3>A fresh starting point</h3><p>Give familiar toys a new role when you’re wondering what to play.</p></div><div><span className="gb-benefit-cue"><SectionIcon kind="details"/></span><h3>Useful details</h3><p>Read the estimated time, materials, steps, adult role and safety notes in each idea.</p></div><div><span className="gb-benefit-cue"><SectionIcon kind="choice"/></span><h3>Room for your judgment</h3><p>Choose what fits your child, your toys and the moment. You know them best.</p></div></div></section>
      <section className="gb-reuse gb-container" aria-labelledby="reuse-heading"><div><span className="gb-planned-label">Planned for Gummy Bear</span><SectionHeading id="reuse-heading" title="Give a familiar toy a fresh role.">A little help rediscovering what’s already there.</SectionHeading><p>Saved toy collections and gentle rediscovery reminders are part of the planned experience. They are not available in today’s app.</p></div><div className="gb-reuse-preview"><span>Illustrative reminder</span><h3>Want to revisit this toy?</h3><p>Explore a new idea for a toy you’ve added to your collection.</p><p className="gb-small">A parent chooses what happens next. No assumptions about play at home.</p></div></section>
      <section className="gb-section gb-container gb-privacy" id="privacy" aria-labelledby="privacy-heading"><SectionHeading id="privacy-heading" title="Your choices matter.">Share a toy photo you’re comfortable sending for analysis.</SectionHeading><div className="gb-privacy-columns"><div><h3>You choose the photo</h3><p>Use the camera or select a photo from your device. The app does not request unrestricted access to your photo library.</p></div><div><h3>Know what is sent</h3><p>Your browser reduces the photo, then sends it for AI analysis with the selected age. Keep faces and unrelated family information out of the frame.</p></div></div><p className="gb-small">This explains today’s upload flow. It is not a full privacy policy. Toy history and parent-facing photo retention controls are planned.</p></section>
      <section className="gb-section gb-container gb-faq" id="faq" aria-labelledby="faq-heading"><SectionHeading id="faq-heading" title="A few things you might be wondering."/><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      <section className="gb-final gb-container" aria-labelledby="final-heading"><div><h2 id="final-heading">Ready for a new play idea?</h2><p>Start with a toy you already have.</p></div><ButtonLink href="/app">Get Started</ButtonLink></section>
    </main>
    <footer className="gb-footer gb-container"><BrandLogo/><p>More imagination. Same toys.</p><nav aria-label="Footer navigation"><a href="#privacy">Privacy information</a><a href="#faq">Questions</a><a href="/app">Open the app</a></nav></footer>
  </div>;
}
