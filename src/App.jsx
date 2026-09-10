import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Certificate,
  ChatCircleDots,
  CheckCircle,
  Crosshair,
  Cube,
  EnvelopeSimple,
  Factory,
  GearSix,
  Handshake,
  Headset,
  List,
  MagnifyingGlass,
  MapPin,
  PaperPlaneTilt,
  PencilRuler,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkle,
  Timer,
  Truck,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { SITE_ORIGIN, serviceByPath, services } from "./serviceData.js";
import { normalizePath, stripBasePath, withBasePath } from "./pathing.js";

const APP_BASE_URL = import.meta.env.BASE_URL || "/";
const siteHref = (path) => withBasePath(path, APP_BASE_URL);
const serviceHref = (path) => siteHref(`${normalizePath(path)}/`);
const assetHref = (path) => siteHref(path);

const processSteps = [
  { icon: MagnifyingGlass, title: "Анализ задачи", text: "Изучаем 3D-модель, материал, тираж и требования к поверхности." },
  { icon: PencilRuler, title: "DFM и конструкция", text: "Проверяем технологичность изделия и проектируем механику формы." },
  { icon: Cube, title: "3D-проект", text: "Согласовываем разъёмы, литниковую систему, охлаждение и выброс." },
  { icon: GearSix, title: "Мехобработка", text: "Фрезеруем детали на ЧПУ, выполняем EDM и термообработку." },
  { icon: Crosshair, title: "Контроль", text: "Измеряем критические размеры и оформляем протокол точности." },
  { icon: Factory, title: "Испытание T0", text: "Проводим пробные отливки и доводим рабочие режимы." },
  { icon: Truck, title: "Запуск", text: "Передаём форму, паспорт, ЗИП и сопровождаем запуск у заказчика." },
];

const advantages = [
  { icon: Ruler, value: "±0,01 мм", label: "контроль точности" },
  { icon: ShieldCheck, value: "100%", label: "проверка перед отгрузкой" },
  { icon: Timer, value: "48 часов", label: "на первичный разбор" },
  { icon: Certificate, value: "до 1 млн", label: "циклов по заданию" },
  { icon: Handshake, value: "1 команда", label: "от DFM до запуска" },
];

const cases = [
  { title: "Корпус промышленного датчика", image: "/assets/mold-assembly.png", tags: ["2 гнезда", "ABS GF20", "31 день"], result: "Стабильная геометрия без дополнительной мехобработки" },
  { title: "Техническая деталь для автокомпонента", image: "/assets/metrology-quality.png", tags: ["точность ±0,02", "PA66", "46 дней"], result: "Ресурс подтверждён серией из 120 000 циклов" },
  { title: "Комплект оснастки для электроники", image: "/assets/cnc-milling.jpg", tags: ["4 формы", "PC/ABS", "серия"], result: "Единый запуск четырёх изделий на одной площадке" },
];

const serviceIcons = [Cube, GearSix, ShieldCheck, PencilRuler, Factory, Ruler];

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function usePageMetadata(service, notFound, currentPath) {
  useEffect(() => {
    const title = notFound ? "Страница не найдена — TAV PRESS FORM" : service?.seoTitle || "Изготовление пресс-форм под ключ — TAV PRESS FORM";
    const description = notFound
      ? "Запрошенная страница TAV PRESS FORM не найдена. Перейдите к направлениям изготовления пресс-форм."
      : service?.metaDescription || "Проектирование, изготовление, испытание и запуск пресс-форм для серийного производства. DFM-анализ, точная мехобработка и контроль T0/T1.";
    const path = service?.path || (notFound ? currentPath : "/");
    const canonical = service
      ? `${SITE_ORIGIN}${path}/`
      : `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
    const image = `${SITE_ORIGIN}${service?.image || "/assets/hero-press-form.png"}`;

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: notFound ? "noindex, follow" : "index, follow, max-image-preview:large" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const organization = {
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      name: "TAV PRESS FORM",
      url: SITE_ORIGIN,
      telephone: "+375296174005",
      email: "form@tavgroup.by",
      address: { "@type": "PostalAddress", addressLocality: "Могилёв", addressCountry: "BY" },
    };
    const graph = service ? [
      organization,
      { "@type": "Service", "@id": `${canonical}#service`, name: service.h1, description, url: canonical, image, provider: { "@id": `${SITE_ORIGIN}/#organization` }, areaServed: ["Беларусь", "Россия", "ЕАЭС"] },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: SITE_ORIGIN },
        { "@type": "ListItem", position: 2, name: service.title, item: canonical },
      ] },
      { "@type": "FAQPage", mainEntity: service.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ] : [
      organization,
      { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: "TAV PRESS FORM", url: SITE_ORIGIN, inLanguage: "ru" },
    ];
    let jsonLd = document.getElementById("page-structured-data");
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.type = "application/ld+json";
      jsonLd.id = "page-structured-data";
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  }, [currentPath, notFound, service]);
}

function Logo() {
  return <a className="logo" href={siteHref("/")} aria-label="TAV PRESS FORM — на главную"><span>TAV</span> <strong>PRESS FORM</strong></a>;
}

function Header({ onRequest, currentPath }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <button ref={menuButtonRef} className="menu-toggle" onClick={() => setOpen((value) => !value)} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="main-navigation">
          {open ? <X size={26} /> : <List size={28} />}
        </button>
        <nav id="main-navigation" className={open ? "nav nav-open" : "nav"} aria-label="Основная навигация">
          <a href={siteHref("/#services")} onClick={closeMenu}>Пресс-формы</a>
          <a href={siteHref("/#process")} onClick={closeMenu}>Процесс</a>
          <a href={siteHref("/#production")} onClick={closeMenu}>Производство</a>
          <a href={siteHref("/#cases")} onClick={closeMenu}>Проекты</a>
          <a href={siteHref("/#contacts")} onClick={closeMenu}>Контакты</a>
          <div className="mobile-nav-actions"><a href="tel:+375296174005">+375 29 617-40-05</a><button className="button button-primary" onClick={() => { closeMenu(); onRequest("Изготовление пресс-формы"); }}>Получить расчёт</button></div>
        </nav>
        <a className="header-phone" href="tel:+375296174005">+375 29 617-40-05</a>
        <button className="button button-outline header-cta" onClick={() => onRequest("Изготовление пресс-формы")}>Получить расчёт</button>
      </div>
      {currentPath !== "/" && <div className="header-route-line" />}
    </header>
  );
}

function SectionHeading({ eyebrow, children, description, id }) {
  return <div className="section-heading">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={id}>{children}</h2>{description && <p>{description}</p>}</div>;
}

function RequestForm({ compact = false, selectedService = "" }) {
  const [status, setStatus] = useState("idle");
  const [fileName, setFileName] = useState("");

  function submit(event) {
    event.preventDefault();
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 650);
  }

  if (status === "sent") {
    return <div className="form-success" role="status"><CheckCircle size={54} weight="fill" /><h3>Заявка принята</h3><p>Инженер свяжется с вами, уточнит исходные данные и предложит следующий шаг.</p></div>;
  }

  return (
    <form className={compact ? "request-form compact-form" : "request-form"} onSubmit={submit}>
      <label><span>Имя</span><input name="name" autoComplete="name" placeholder="Как к вам обращаться" required /></label>
      <label><span>Телефон</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+375 __ ___-__-__" required /></label>
      <label className="wide-field"><span>Тип проекта</span>{selectedService ? <input name="service" value={selectedService} readOnly /> : <select name="service" defaultValue="" required><option value="" disabled>Выберите направление</option>{services.map((item) => <option key={item.path}>{item.title}</option>)}</select>}</label>
      {!compact && <label className="wide-field"><span>Коротко о задаче</span><textarea name="message" placeholder="Материал изделия, планируемый тираж, оборудование и желаемый срок" rows="4" /></label>}
      <label className="file-control wide-field"><UploadSimple size={21} /><span>{fileName || "Прикрепить 3D-модель или чертёж"}</span><input type="file" accept=".step,.stp,.x_t,.iges,.igs,.pdf,.zip" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /></label>
      <label className="consent wide-field"><input type="checkbox" required /><span>Согласен на обработку персональных данных для подготовки предложения.</span></label>
      <button className="button button-primary form-submit" disabled={status === "sending"}>{status === "sending" ? "Отправляем…" : "Получить расчёт"}{status !== "sending" && <ArrowRight size={18} weight="bold" />}</button>
    </form>
  );
}

function RequestModal({ service, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const focusables = dialogRef.current?.querySelectorAll('button, input, select, textarea, a[href]');
    focusables?.[0]?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && focusables?.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-title" aria-describedby="request-description">
        <button className="modal-close" onClick={onClose} aria-label="Закрыть"><X size={24} /></button>
        <span className="eyebrow">Инженерный расчёт</span><h2 id="request-title">Обсудим вашу пресс-форму</h2>
        <p id="request-description">Оставьте контакт и приложите модель, если она уже есть. Ответим по составу работ и сроку расчёта.</p>
        <RequestForm compact selectedService={service} />
      </div>
    </div>
  );
}

function ChatManager({ open, onOpenChange, seed }) {
  const initial = useMemo(() => [{ from: "manager", text: "Здравствуйте! Помогу подобрать пресс-форму и рассчитать производство." }], []);
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const textareaRef = useRef(null);
  const formRef = useRef(null);
  const logRef = useRef(null);
  const openButtonRef = useRef(null);
  const lastSeedRef = useRef("");

  function resizeComposer() {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 132)}px`;
  }

  useEffect(() => {
    if (!open) return;
    if (seed && seed !== lastSeedRef.current) { setText(seed); lastSeedRef.current = seed; }
    const timer = window.setTimeout(() => { textareaRef.current?.focus(); resizeComposer(); }, 80);
    return () => window.clearTimeout(timer);
  }, [open, seed]);

  useEffect(() => {
    if (open) logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, typing]);

  function setChatOpen(next) {
    onOpenChange(next);
    if (!next) window.setTimeout(() => openButtonRef.current?.focus(), 0);
  }

  function send(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value || typing) return;
    setMessages((items) => [...items, { from: "user", text: value }]);
    setText("");
    setTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    window.setTimeout(() => {
      setMessages((items) => [...items, { from: "manager", text: "Понял задачу. Подскажите материал изделия, планируемый тираж и есть ли 3D-модель — так инженер быстрее оценит конструкцию и состав работ." }]);
      setTyping(false);
    }, 650);
  }

  return (
    <div className="chat-widget tav-import-chat">
      {open && (
        <aside id="chat-panel" className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title">
          <header><div className="agent-avatar"><Headset size={22} /></div><div><strong id="chat-title">Консультант TAV</strong><span><i /> ИИ-консультант · онлайн</span></div><button onClick={() => setChatOpen(false)} aria-label="Закрыть чат"><X size={22} /></button></header>
          <div ref={logRef} className="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message, index) => <p key={`${message.from}-${index}`} className={message.from === "user" ? "user" : "agent"}>{message.text}</p>)}
            {typing && <p className="agent typing" role="status" aria-label="Консультант готовит ответ"><span>Готовлю ответ</span><b aria-hidden="true"><i /><i /><i /></b></p>}
          </div>
          <form ref={formRef} onSubmit={send}>
            <label className="sr-only" htmlFor="chat-message">Сообщение консультанту</label>
            <textarea ref={textareaRef} id="chat-message" value={text} onChange={(event) => { setText(event.target.value); resizeComposer(); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); formRef.current?.requestSubmit(); } }} placeholder="Введите сообщение…" rows="1" />
            <button aria-label="Отправить" disabled={!text.trim() || typing}><PaperPlaneTilt size={21} weight="fill" /></button>
          </form>
        </aside>
      )}
      <button ref={openButtonRef} className="chat-toggle" onClick={() => setChatOpen(!open)} aria-expanded={open} aria-controls="chat-panel" aria-label={open ? "Закрыть чат-менеджер" : "Открыть чат-менеджер"}>{open ? <X size={23} /> : <ChatCircleDots size={25} weight="fill" />}<span>Чат-менеджер</span></button>
    </div>
  );
}

function ProcessTimeline({ items = processSteps, className = "" }) {
  return (
    <ol className={`process-grid ${className}`.trim()}>
      {items.map((step, index) => {
        const Icon = step.icon || serviceIcons[index % serviceIcons.length];
        return <li className="process-step" key={step.title}><div className="process-index" aria-hidden="true">{index + 1}</div><div className="process-icon"><Icon size={43} weight="thin" /></div><div className="process-copy"><h3>{step.title}</h3><p>{step.text}</p></div></li>;
      })}
    </ol>
  );
}

function ContactStrip() {
  return <section id="contacts" className="contact-strip" aria-labelledby="contact-title"><div className="container contact-grid"><div className="contact-title"><span className="eyebrow">Связаться напрямую</span><h2 id="contact-title">Обсудим ваш проект</h2></div><a href="tel:+375296174005"><Phone size={36} weight="thin" /><span><small>Телефон</small>+375 29 617-40-05</span></a><a href="mailto:form@tavgroup.by"><EnvelopeSimple size={38} weight="thin" /><span><small>Почта</small>form@tavgroup.by</span></a><div className="contact-address"><MapPin size={38} weight="thin" /><span><small>Производство</small>Могилёв · Беларусь</span></div></div></section>;
}

function Footer() {
  return <footer className="footer"><div className="container footer-grid"><div className="footer-brand"><Logo /><p>Проектирование, изготовление и запуск пресс-форм для серийного производства.</p></div><div><strong>Пресс-формы</strong>{services.slice(0, 3).map((item) => <a key={item.path} href={serviceHref(item.path)}>{item.title}</a>)}</div><div><strong>Оснастка и сервис</strong>{services.slice(3).map((item) => <a key={item.path} href={serviceHref(item.path)}>{item.title}</a>)}</div><div><strong>Связаться</strong><a href="tel:+375296174005">+375 29 617-40-05</a><a href="mailto:form@tavgroup.by">form@tavgroup.by</a><span>Пн–Пт · 09:00–18:00</span></div></div><div className="container footer-bottom"><span>© TAV PRESS FORM, 2026</span><span>Точное производство начинается с точной оснастки</span></div></footer>;
}

function ServiceCard({ service, onRequest }) {
  return <article className="service-card"><img src={assetHref(service.image)} alt="" loading="lazy" /><div className="service-shade" /><span className="card-number">{service.number}</span><div className="service-content"><h3><a href={serviceHref(service.path)}>{service.title}</a></h3><p>{service.short}</p><div className="service-actions"><a href={serviceHref(service.path)}>Подробнее <ArrowRight size={18} weight="bold" /></a><button onClick={() => onRequest(service.title)}>Рассчитать</button></div></div></article>;
}

function HomePage({ onRequest, onChat }) {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title"><div className="hero-inner"><div className="hero-copy"><span className="eyebrow">TAV PRESS FORM</span><h1 id="hero-title">ПРЕСС-ФОРМЫ<br />ДЛЯ СЕРИЙНОГО<br />ПРОИЗВОДСТВА</h1><p>Проектируем, изготавливаем и запускаем пресс-формы под ключ — от DFM-анализа детали до первых стабильных отливок.</p><div className="hero-actions"><button className="button button-primary" onClick={() => onRequest("Изготовление пресс-формы")}>Рассчитать проект <ArrowRight size={18} weight="bold" /></button><a className="text-link" href="#production">Наше производство <ArrowRight size={18} /></a></div></div><div className="hero-facts" aria-label="Ключевые преимущества"><div><MapPin size={30} /><span><strong>РБ · РФ · ЕАЭС</strong>Поставка и запуск</span></div><div><Cube size={31} /><span><strong>Полный цикл</strong>От идеи до серии</span></div><div><ShieldCheck size={31} /><span><strong>Контроль качества</strong>Протокол измерений</span></div></div></div><a className="scroll-cue" href="#services" aria-label="Перейти к направлениям">SCROLL <span /></a></section>
      <section id="services" className="section services-section" aria-labelledby="services-title"><div className="container"><SectionHeading id="services-title" eyebrow="Компетенции" description="Подбираем конструкцию под материал, оборудование, цикл и ресурс изделия.">Пресс-формы под вашу технологию</SectionHeading><div className="service-grid">{services.map((item) => <ServiceCard service={item} onRequest={onRequest} key={item.path} />)}</div></div></section>
      <section id="process" className="section process-section" aria-labelledby="process-title"><div className="wide-container"><SectionHeading id="process-title" eyebrow="7 этапов" description="Ведём один технический контур ответственности — от входных данных до серийного запуска.">Берём на себя весь процесс</SectionHeading><ProcessTimeline /></div></section>
      <section className="section advantages-section" aria-labelledby="advantages-title"><div className="wide-container advantages-layout"><div className="advantages-lead"><span className="eyebrow">Почему мы</span><h2 id="advantages-title">TAV<br /><strong>PRESS FORM</strong></h2><p>Инженерная команда, понятные контрольные точки и производство без разрывов ответственности.</p></div><div className="advantage-grid">{advantages.map((item) => { const Icon = item.icon; return <div className="advantage-item" key={item.value}><Icon size={47} weight="thin" /><strong>{item.value}</strong><span>{item.label}</span></div>; })}</div></div></section>
      <section id="production" className="section production-section" aria-labelledby="production-title"><div className="container production-card"><div className="production-image"><img src={assetHref("/assets/metrology-quality.png")} alt="Контроль пресс-формы на координатно-измерительной машине" loading="lazy" /></div><div className="production-copy"><span className="eyebrow">Производственный контур</span><h2 id="production-title">Точность начинается с инженерии</h2><p>Проектируем форму вокруг реального процесса литья: учитываем усадку, баланс потоков, охлаждение, выброс и обслуживание. Каждый критический размер проходит инструментальный контроль.</p><ul><li><CheckCircle size={20} weight="fill" /> 3D-проектирование и Moldflow-анализ</li><li><CheckCircle size={20} weight="fill" /> 3–5-осевая обработка, EDM и шлифование</li><li><CheckCircle size={20} weight="fill" /> CMM-контроль и протокол испытаний T0/T1</li></ul><button className="button button-outline" onClick={() => onChat("Хочу обсудить технологичность изделия и конструкцию пресс-формы.")}>Задать вопрос инженеру</button></div></div></section>
      <section id="cases" className="section cases-section" aria-labelledby="cases-title"><div className="container"><SectionHeading id="cases-title" eyebrow="Реализованные проекты" description="Показываем результат в производственных метриках, а не только в красивом металле.">Пресс-формы в работе</SectionHeading><div className="case-grid">{cases.map((item) => <article className="case-card" key={item.title}><div className="case-image"><img src={assetHref(item.image)} alt="" loading="lazy" /></div><div className="case-copy"><h3>{item.title}</h3><div className="case-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><p>{item.result}</p><button onClick={() => onChat(`Хочу узнать подробнее о проекте «${item.title}».`)}>Смотреть задачу <ArrowRight size={18} /></button></div></article>)}</div></div></section>
      <section className="section request-section" aria-labelledby="request-section-title"><div className="container request-card"><div className="request-intro"><span className="eyebrow">Предварительная оценка</span><h2 id="request-section-title">Рассчитаем пресс-форму под вашу деталь</h2><p>Прикрепите модель STEP или чертёж. Инженер проверит технологичность, задаст уточняющие вопросы и подготовит состав работ.</p><div className="request-points"><span><Sparkle size={20} /> DFM-анализ</span><span><Timer size={20} /> Ответ за 48 часов</span></div></div><RequestForm /></div></section>
      <ContactStrip />
    </main>
  );
}

function ServicePage({ service, onRequest, onChat }) {
  return (
    <main id="main-content" className="service-page">
      <section className="service-hero" aria-labelledby="service-hero-title" style={{ "--service-image": `url("${assetHref(service.image)}")` }}><div className="container service-hero-inner"><nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><a href={siteHref("/")}>Главная</a></li><li><a href={siteHref("/#services")}>Пресс-формы</a></li><li aria-current="page">{service.title}</li></ol></nav><div className="service-hero-copy"><span className="eyebrow">{service.eyebrow}</span><h1 id="service-hero-title">{service.h1}</h1><p>{service.lead}</p><div className="hero-actions"><button className="button button-primary" onClick={() => onRequest(service.title)}>Отправить заявку <ArrowRight size={18} weight="bold" /></button><button className="button button-outline" onClick={() => onChat(service.questionSeed)}>Задать вопрос</button></div></div><dl className="service-facts">{service.facts.map((fact) => <div key={fact.label}><dt>{fact.value}</dt><dd>{fact.label}</dd></div>)}</dl></div></section>
      <section className="section deliverables-section" aria-labelledby="deliverables-title"><div className="container"><SectionHeading id="deliverables-title" eyebrow="Возможности" description="Состав оснастки уточняем по геометрии детали, материалу, оборудованию и планируемому ресурсу.">Что изготавливаем</SectionHeading><div className="deliverables-grid">{service.deliverables.map((item, index) => { const Icon = serviceIcons[index % serviceIcons.length]; return <article className="deliverable-card" key={item.title}><Icon size={34} weight="thin" /><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div></div></section>
      <section className="section engineering-section" aria-labelledby="engineering-title"><div className="container engineering-layout"><div className="engineering-image"><img src={assetHref(service.image)} alt={service.imageAlt} loading="lazy" /></div><div className="engineering-copy"><span className="eyebrow">Инженерный подход</span><h2 id="engineering-title">Проектируем под реальный цикл</h2><p>{service.intro}</p><div className="engineering-list">{service.engineering.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div></div></div></section>
      <section className="section service-process-section" aria-labelledby="service-process-title"><div className="wide-container"><SectionHeading id="service-process-title" eyebrow={`${service.process.length} этапов`} description="Каждый этап заканчивается понятным результатом и согласованием следующего шага.">Как проходит проект</SectionHeading><ProcessTimeline items={service.process} className="service-process-grid" /></div></section>
      <section className="section faq-section" aria-labelledby="faq-title"><div className="container faq-layout"><div className="faq-intro"><span className="eyebrow">FAQ</span><h2 id="faq-title">Частые вопросы</h2><p>Ответили на вопросы, которые чаще всего возникают до первичного технического разбора.</p></div><div className="faq-list">{service.faq.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><i aria-hidden="true">+</i></summary><p>{item.answer}</p></details>)}</div></div></section>
      <section className="section other-services-section" aria-labelledby="other-services-title"><div className="container"><SectionHeading id="other-services-title" eyebrow="Другие компетенции">Другие направления</SectionHeading><div className="other-services-grid">{services.filter((item) => item.path !== service.path).map((item) => <a href={serviceHref(item.path)} key={item.path}><span>{item.number}</span><strong>{item.title}</strong><ArrowRight size={22} /></a>)}</div></div></section>
      <ContactStrip />
    </main>
  );
}

function NotFoundPage() {
  return <main id="main-content" className="not-found"><div className="container"><span className="eyebrow">Ошибка 404</span><h1>Такой страницы нет</h1><p>Вернитесь на главную или выберите подходящее направление изготовления пресс-форм.</p><a className="button button-primary" href={siteHref("/#services")}>Смотреть услуги <ArrowRight size={18} /></a></div></main>;
}

export function App() {
  const currentPath = stripBasePath(window.location.pathname, APP_BASE_URL);
  const service = serviceByPath[currentPath];
  const isHome = currentPath === "/";
  const notFound = !isHome && !service;
  const [modalService, setModalService] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState("");
  usePageMetadata(service, notFound, currentPath);

  const openChat = (message = "") => { setChatSeed(message); setChatOpen(true); };

  return <div id="top" className="site-shell"><a className="skip-link" href="#main-content">Перейти к содержимому</a><Header onRequest={setModalService} currentPath={currentPath} />{isHome && <HomePage onRequest={setModalService} onChat={openChat} />}{service && <ServicePage service={service} onRequest={setModalService} onChat={openChat} />}{notFound && <NotFoundPage />}<Footer /><ChatManager open={chatOpen} onOpenChange={setChatOpen} seed={chatSeed} />{modalService && <RequestModal service={modalService} onClose={() => setModalService("")} />}</div>;
}
