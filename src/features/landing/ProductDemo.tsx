export default function ProductDemo() {
  return <figure className="gb-demo" aria-labelledby="demo-caption">
    <figcaption id="demo-caption"><div><strong>A little look ahead</strong><span>Illustrative preview — planned experience</span></div><img className="gb-mascot" src="/images/gummy-bear-character.webp" width="112" height="112" alt=""/></figcaption>
    <ol className="gb-demo-steps">
      <li className="gb-demo-photo"><span className="gb-demo-step">1. Photo <span>One familiar toy</span></span><img className="gb-toy-photo" src="/images/toy-teddy-640.webp" srcSet="/images/toy-teddy-640.webp 640w, /images/toy-teddy-960.webp 960w" sizes="(max-width: 540px) calc(100vw - 80px), (max-width: 780px) 492px, (max-width: 1024px) 400px, 488px" width="960" height="640" fetchPriority="high" alt="Real photograph of an ordinary plush teddy bear, used as an example toy"/><span className="gb-photo-caption">Example toy photograph · <a href="https://commons.wikimedia.org/wiki/File:Teddy_Bear_-_7.jpg">Dan Bollinger</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></span></li>
      <li className="gb-demo-confirm"><span className="gb-demo-step">2. Confirm <span>Planned step</span></span><div><strong>Teddy bear</strong><span className="gb-demo-confirmed">✓ Example confirmation</span></div><p>You’ll be able to check and correct the toy name.</p></li>
      <li className="gb-demo-activity"><span className="gb-demo-step">3. Play <span>Example activity · Age 4</span></span><h3>Teddy’s little adventure</h3><p>Make the floor a pretend forest. Help Teddy visit three imaginary places, then tell the story together.</p><div className="gb-demo-meta"><span>About 10 minutes</span><span>One intact teddy</span><span>Adult joins in</span></div><p className="gb-demo-safety">Check for loose parts. Keep the adventure on the floor.</p></li>
    </ol>
    <p className="gb-demo-note">Today’s app finds toy names and ideas together. Separate confirmation and saved history are planned.</p>
  </figure>;
}
