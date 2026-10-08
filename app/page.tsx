'use client';

import { useEffect, useState } from 'react';

const swapWords = ['uploading', 'pricing', 'restocking', 'replying', 'reporting'];

const statusCards = [
  { icon: 'package', title: 'Catalog bot', text: 'Added 12 products. Ready for review.' },
  { icon: 'tag', title: 'Pricing bot', text: 'Weekend sale is live.' },
  { icon: 'truck', title: 'Orders bot', text: 'Order #1042 shipped to Thandi.' }
] as const;

const bots = [
  { icon: 'package', title: 'Lists it.', label: 'Catalog bot', text: 'Drop in photos and a rough idea. Titles, descriptions, sizes and prices come back ready to review.' },
  { icon: 'tag', title: 'Prices it.', label: 'Pricing bot', text: 'Sales, discounts and price changes set up in one sentence, and switched off on time.' },
  { icon: 'truck', title: 'Ships it.', label: 'Orders bot', text: 'Watches every order, flags problems early, and keeps customers in the loop.' },
  { icon: 'message-circle', title: 'Answers it.', label: 'Support bot', text: 'Replies to customers day and night, and hands the tricky ones to you.' },
  { icon: 'boxes', title: 'Restocks it.', label: 'Stock bot', text: "Spots what's running low before it sells out and drafts the reorder." },
  { icon: 'trending-up', title: 'Grows it.', label: 'Growth bot', text: 'Finds what\'s selling, writes the campaign, and tells you what worked.' }
] as const;

const steps = [
  { number: '01', title: 'Say what you want.', text: 'Type it like a text message. "Add my new candle range, three sizes, from R90."' },
  { number: '02', title: 'The bots get to work.', text: 'Products, prices, pages and orders move. Nothing for you to click through.' },
  { number: '03', title: 'You approve. It\'s live.', text: 'Big changes wait for your tap. Then your store is open, and so is the till.' }
] as const;

const todo = [
  { label: 'Catalog bot', text: '20 products live', old: 'Add the 20 new winter products' },
  { label: 'Pricing bot', text: 'Sale scheduled', old: 'Put everything 15% off this weekend' },
  { label: 'Support bot', text: 'Replied, refund offered', old: 'Reply to Thandi about her late order' },
  { label: 'Stock bot', text: 'Reorder drafted', old: 'Reorder the candles before they sell out' },
  { label: 'Growth bot', text: 'Report in your inbox', old: 'Work out what sold this month' }
] as const;

const features = [
  { icon: 'shield-check', title: 'Asks before big moves', text: 'Changes to prices, products and orders wait for your tap.' },
  { icon: 'undo-2', title: 'Undo anything', text: 'Every change is saved, so you can roll it back.' },
  { icon: 'list-checks', title: 'Every move on record', text: 'A plain timeline of what each bot did, and when.' },
  { icon: 'moon', title: 'Works while you sleep', text: 'Routines run overnight. You wake up to the summary.' },
  { icon: 'chart-column', title: 'Know what sells', text: 'Built-in analytics that count visits without cookies or spying on your customers.' },
  { icon: 'store', title: 'A real store underneath', text: 'Your products, orders and customers live in a proper open-source commerce engine.' }
] as const;

type IconName =
  | 'arrow-right'
  | 'package'
  | 'tag'
  | 'truck'
  | 'message-circle'
  | 'boxes'
  | 'trending-up'
  | 'check'
  | 'shield-check'
  | 'undo-2'
  | 'list-checks'
  | 'moon'
  | 'chart-column'
  | 'store';

function Icon({ name }: { name: IconName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (name) {
    case 'arrow-right':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" {...common} />
          <path d="M13 5l7 7-7 7" {...common} />
        </svg>
      );
    case 'package':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" {...common} />
          <path d="M12 3v9l8 4.5M12 12L4 7.5" {...common} />
        </svg>
      );
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 10l-8.5 8.5L4 13V4h9l7 6z" {...common} />
          <circle cx="9" cy="9" r="1.3" />
        </svg>
      );
    case 'truck':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h11v8H3zm0 0l3-3h8v3" {...common} />
          <path d="M14 11h4l3 3v1h-7v-4zM7 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" {...common} />
        </svg>
      );
    case 'message-circle':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 18l-3 3V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H7z" {...common} />
          <path d="M8 9h8M8 13h6" {...common} />
        </svg>
      );
    case 'boxes':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" {...common} />
          <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" {...common} />
        </svg>
      );
    case 'trending-up':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16l7-7 5 5 6-8" {...common} />
          <path d="M16 6h4v4" {...common} />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 3.5" {...common} />
        </svg>
      );
    case 'shield-check':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l7 3v6c0 4.2-2.7 7.8-7 9-4.3-1.2-7-4.8-7-9V6l7-3z" {...common} />
          <path d="M8.5 12.5l2.2 2.2 4.8-5" {...common} />
        </svg>
      );
    case 'undo-2':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 14L4 9l5-5" {...common} />
          <path d="M20 19v-3a6 6 0 00-6-6H4" {...common} />
        </svg>
      );
    case 'list-checks':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6h11M9 12h11M9 18h11" {...common} />
          <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" {...common} />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A7.5 7.5 0 119.5 4a7 7 0 0010.5 10.5z" {...common} />
        </svg>
      );
    case 'chart-column':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 20V9M12 20V4M19 20v-7" {...common} />
        </svg>
      );
    case 'store':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10h16l-1.5 10h-13L4 10z" {...common} />
          <path d="M6 10V7.5A6 6 0 0118 7.5V10" {...common} />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  const [activeWord, setActiveWord] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    subdomain: '',
    email: '',
    password: ''
  });
  const [provisionState, setProvisionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [provisionResult, setProvisionResult] = useState<{ url?: string; publicIp?: string; error?: string }>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveWord((current) => (current + 1) % swapWords.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleStoreNameChange = (name: string) => {
    const sanitizedSubdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData((prev) => ({
      ...prev,
      storeName: name,
      subdomain: sanitizedSubdomain
    }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionState('loading');
    setProvisionResult({});

    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProvisionState('success');
        setProvisionResult({ url: data.url, publicIp: data.publicIp });
      } else {
        setProvisionState('error');
        setProvisionResult({ error: data.error || data.message || 'Provisioning failed' });
      }
    } catch (err: any) {
      setProvisionState('error');
      setProvisionResult({ error: err.message || 'Network error during provisioning' });
    }
  };

  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a className="logo" href="#top" aria-label="wwwebby home">
            wwwebby
            <em />
          </a>
          <nav aria-label="Main navigation">
            <a href="#bots">The bots</a>
            <a href="#how">How it works</a>
            <a href="#control">Control</a>
          </nav>
          <button className="btn" onClick={() => setIsModalOpen(true)}>
            Get started
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow rv">Ecommerce, handled.</p>
            <h1 className="rv" aria-label="Stop the busywork. Start selling.">
              <span className="row">
                Stop{' '}
                <span className="swap" aria-hidden="true">
                  {swapWords.map((word, index) => (
                    <span key={word} className={`w ${index === activeWord ? 'is-visible' : ''}`}>
                      {word}
                      <i className="strike" />
                    </span>
                  ))}
                </span>
                .
              </span>
              <span className="row">Start selling.</span>
            </h1>

            <div className="foot">
              <div className="rv">
                <p className="lead">
                  wwwebby gives you a real online store and a crew of bots that run it. Tell them what you want. They get it done.
                </p>
                <div className="cta">
                  <button className="btn" onClick={() => setIsModalOpen(true)}>
                    Get started <Icon name="arrow-right" />
                  </button>
                  <a className="btn ghost" href="#bots">
                    Meet the bots
                  </a>
                </div>
              </div>

              <div className="cards" aria-hidden="true">
                {statusCards.map((card) => (
                  <div className="card" key={card.title}>
                    <span className="ic">
                      <Icon name={card.icon} />
                    </span>
                    <div>
                      <b>{card.title}</b>
                      <span>{card.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="marq" aria-hidden="true">
          <div className="track">
            <span>Listed</span>
            <span>Priced</span>
            <span>Shipped</span>
            <span>Answered</span>
            <span>Restocked</span>
            <span>Reported</span>
          </div>
        </div>

        <section>
          <div className="wrap">
            <p className="stmt">Your store doesn&apos;t sleep, forget, or say &quot;I&apos;ll do it tomorrow.&quot;</p>
          </div>
        </section>

        <section id="bots" className="crew-section">
          <div className="wrap">
            <p className="kick rv">The crew</p>
            <h2 className="rv">Meet the bots that get it done.</h2>
            <div className="grid">
              {bots.map((bot) => (
                <article className="bot rv" key={bot.label}>
                  <span className="ic">
                    <Icon name={bot.icon} />
                  </span>
                  <h3>{bot.title}</h3>
                  <small>{bot.label}</small>
                  <p>{bot.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="how" id="how">
          <div className="wrap pin">
            <div className="steps">
              {steps.map((step) => (
                <article className="step" key={step.number}>
                  <span className="n">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <div className="art" aria-hidden="true">
              <svg viewBox="0 0 200 200">
                <path
                  d="M40 50Q40 30 60 30H140Q160 30 160 50V110Q160 130 140 130H98L68 160V130H60Q40 130 40 110Z"
                  fill="none"
                  stroke="#000"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </section>

        <section className="todo">
          <div className="wrap">
            <p className="kick rv">While you were busy</p>
            <h2 className="rv">Your to-do list, crossed off.</h2>
            <ul>
              {todo.map((item) => (
                <li key={item.label}>
                  <span className="old">
                    {item.old}
                    <i className="line" />
                  </span>
                  <div className="new">
                    <Icon name="check" />
                    {item.text}
                    <small>{item.label}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="control" className="control-section">
          <div className="wrap">
            <div className="two">
              <div>
                <p className="kick rv">Control</p>
                <h2 className="rv">You stay in charge.</h2>
                <div className="ask rv">
                  <div className="tag">
                    <span className="ic">
                      <Icon name="shield-check" />
                    </span>
                    Pricing bot is asking
                  </div>
                  <h3>Lower 12 prices by 15% for the weekend?</h3>
                  <div className="row">
                    <button className="btn" onClick={() => setIsModalOpen(true)}>
                      Approve
                    </button>
                    <button className="btn ghost" onClick={() => setIsModalOpen(true)}>
                      Not now
                    </button>
                  </div>
                </div>
              </div>

              <div className="feat">
                {features.map((feature) => (
                  <div className="f rv" key={feature.title}>
                    <Icon name={feature.icon} />
                    <b>{feature.title}</b>
                    <p>{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="join" id="join">
          <div className="wrap">
            <h2 className="rv">Open for business.</h2>
            <p className="rv">Provision your automated AI e-commerce store in seconds.</p>
            <form className="rv" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(true); }}>
              <input
                type="email"
                name="email"
                required
                placeholder="you@yourstore.com"
                aria-label="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <button className="btn" type="submit">
                Get started <Icon name="arrow-right" />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Provisioning & Signup Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create your store</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            {provisionState === 'idle' && (
              <form className="signup-form" onSubmit={handleSignupSubmit}>
                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    id="storeName"
                    type="text"
                    required
                    placeholder="My Awesome Store"
                    value={formData.storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subdomain">Custom Subdomain</label>
                  <input
                    id="subdomain"
                    type="text"
                    required
                    placeholder="myawesomestore"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  />
                  <span className="form-hint">
                    Reach your store at: <b>{formData.subdomain || 'yourstore'}.yourdomain.com</b>
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Admin Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@yourstore.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Admin Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button className="btn" type="submit" style={{ marginTop: '0.4rem', justifyContent: 'center' }}>
                  Create store <Icon name="arrow-right" />
                </button>
              </form>
            )}

            {provisionState === 'loading' && (
              <div className="provision-status">
                <div className="spinner" />
                <h3>Provisioning your SaaS Platform...</h3>
                <span className="status-badge">AWS Lightsail VPS + Cloudflare DNS</span>
                <p style={{ fontSize: '0.92rem', color: 'var(--mute)', margin: 0 }}>
                  We are creating a dedicated VPS, configuring DNS, and seeding Medusa, Rakazo AI, &amp; Umami Analytics.
                </p>
              </div>
            )}

            {provisionState === 'success' && (
              <div className="provision-status">
                <span className="ic" style={{ background: '#22c55e' }}>
                  <Icon name="check" />
                </span>
                <h3>Platform Ready!</h3>
                <p style={{ margin: 0 }}>
                  Your dedicated SaaS instance has been provisioned at IP <b>{provisionResult.publicIp}</b>.
                </p>
                {provisionResult.url && (
                  <a
                    className="btn"
                    href={provisionResult.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: '1rem' }}
                  >
                    Open Store Platform <Icon name="arrow-right" />
                  </a>
                )}
              </div>
            )}

            {provisionState === 'error' && (
              <div className="provision-status">
                <h3>Provisioning Failed</h3>
                <p style={{ color: '#ef4444', margin: 0 }}>{provisionResult.error}</p>
                <button
                  className="btn ghost"
                  onClick={() => setProvisionState('idle')}
                  style={{ marginTop: '1rem' }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer>
        <div className="wrap">
          <a className="logo" href="#top">
            wwwebby
            <em />
          </a>
          <span>&copy; 2026 wwwebby. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
