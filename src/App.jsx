import { useState, useEffect, useRef } from 'react';
import { PRODUCTS } from './data/gameData';
import { beepScan, beepError, beepSuccess, beepPay, beepAlert, beep } from './utils/audio';
import { saveGameProgress, loadGameProgress, clearGameProgress, isFirstTime, markAsVisited, hasExistingSave } from './utils/storage';
import Tutorial from './components/Tutorial';
import LoadGameModal from './components/LoadGameModal';
import { ENHANCED_CUSTOMERS as CUSTOMERS, ENHANCED_RANDOM_EVENTS as RANDOM_EVENTS, ENHANCED_MISSIONS as MISSIONS, SKILL_TREE } from './data/gameDataEnhanced';

// Pure helper functions for generating random values (React 19 linter compliance)
function generateRandomId() {
  return Date.now() + Math.random();
}

function generateRandomScorePosition() {
  return {
    left: 20 + Math.random() * 60,
    top: 30 + Math.random() * 20
  };
}

function getRandomCustomer(customersList) {
  return customersList[Math.floor(Math.random() * customersList.length)];
}

function getRandomSequence() {
  return Math.floor(Math.random() * 900) + 100;
}

function getRandomItemCount() {
  return 3 + Math.floor(Math.random() * 10);
}

function getRandomProduct(productsList) {
  return productsList[Math.floor(Math.random() * productsList.length)];
}

function testRandomChance(probability) {
  return Math.random() < probability;
}

function getRandomEventDelay() {
  return 3000 + Math.random() * 4000;
}

function getRandomPaymentDelay() {
  return 2000 + Math.random() * 1000;
}

function getPromoDiscount(scanItems) {
  let promoDiscount = 0;
  const itemGroups = {};
  scanItems.forEach(item => {
    itemGroups[item.cod] = (itemGroups[item.cod] || 0) + item.qty;
  });

  Object.keys(itemGroups).forEach(cod => {
    const qty = itemGroups[cod];
    if (qty >= 3) {
      const prod = PRODUCTS.find(p => p.cod === cod);
      if (prod) {
        const discountQty = Math.floor(qty / 3);
        promoDiscount += discountQty * prod.p;
      }
    }
  });
  return promoDiscount;
}

export default function App() {
  // Screens: 'boot' | 'login' | 'abertura' | 'title' | 'career' | 'game' | 'result'
  const [screen, setScreen] = useState('boot');

  // Tutorial and persistence states
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState([]);
  const [showSkillTree, setShowSkillTree] = useState(false);

  // Boot screen state
  const [bootLines, setBootLines] = useState([]);

  // Login screen state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginStatus, setLoginStatus] = useState('');

  // Operator and Abertura state
  const [operatorName, setOperatorName] = useState('');
  const [aberturaVal, setAberturaVal] = useState('100,00');

  // Game session states
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [clientsDone, setClientsDone] = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [maxSecs, setMaxSecs] = useState(600);
  const [stress, setStress] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // Customer states
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [custSecs, setCustSecs] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [scanItems, setScanItems] = useState([]);
  const [rawTotal, setRawTotal] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Random event states
  const [activeEvent, setActiveEvent] = useState(null);
  const [supCalled, setSupCalled] = useState(false);
  const [supCorrect, setSupCorrect] = useState(0);
  const [netDown, setNetDown] = useState(false);
  const [cardFail, setCardFail] = useState(false);
  const [cardFailed2, setCardFailed2] = useState(false);
  const [ageCheckNeeded, setAgeCheckNeeded] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [couponActive, setCouponActive] = useState(false);
  const [couponVal, setCouponVal] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  // Stats / Missions / Logs
  const [logs, setLogs] = useState([]);
  const [missions, setMissions] = useState(MISSIONS.map(m => ({ ...m, done: false })));
  const [cpf, setCpf] = useState('CONSUMIDOR NÃO IDENTIFICADO');
  const [clockStr, setClockStr] = useState('08:00:00');
  const [receiptDateStr, setReceiptDateStr] = useState('');

  // Inputs and UI interaction states
  const [selectedCareer, setSelectedCareer] = useState(0);
  const [scannerInput, setScannerInput] = useState('');
  const [pendingQty, setPendingQty] = useState(1);
  const [odMode, setOdMode] = useState('VENDA');
  const [odMain, setOdMain] = useState('Pronto para escanear');
  const [odSub, setOdSub] = useState('Digite código ou use scanner');
  const [odPrice, setOdPrice] = useState('');
  const [cdStatus, setCdStatus] = useState('PASSE OS PRODUTOS');
  const [cdWelcome, setCdWelcome] = useState('OLÁ CONSUMIDOR');
  const [cdItem, setCdItem] = useState('');
  const [cdTotalShow, setCdTotalShow] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'payment' | 'supervisor' | 'consult' | 'cpf' | 'age' | 'suspend' | 'summary'
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [supervisorAction, setSupervisorAction] = useState(null);
  const [supervisorError, setSupervisorError] = useState('');
  const [supervisorTitle, setSupervisorTitle] = useState('AUTORIZAÇÃO');

  const [consultInput, setConsultInput] = useState('');
  const [consultResult, setConsultResult] = useState(null);

  const [cpfInputVal, setCpfInputVal] = useState('');
  const [showCpfField, setShowCpfField] = useState(false);

  const [paymentMode, setPaymentMode] = useState('selecting'); // 'selecting' | 'debito' | 'credito' | 'pix' | 'dinheiro' | 'processing'
  const [processingMsg, setProcessingMsg] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [cashChange, setCashChange] = useState(0);

  const [finalSummary, setFinalSummary] = useState(null);

  // States for Cash Drawer, Sangria, Suprimento and Fechamento
  const [drawerCash, setDrawerCash] = useState(100.00); // balance of cash drawer
  const [drawerTransactions, setDrawerTransactions] = useState([]); // list of cash drawer operations
  const [sangriaSuprimentoTab, setSangriaSuprimentoTab] = useState('suprimento');
  const [sangriaSuprimentoVal, setSangriaSuprimentoVal] = useState('');
  const [sangriaSuprimentoJust, setSangriaSuprimentoJust] = useState('');
  const [cashCountVal, setCashCountVal] = useState('');
  const [closureReport, setClosureReport] = useState('');

  // States for Cheque and Voucher payment flows
  const [checkVerifyStep, setCheckVerifyStep] = useState(0); // 0 to 4
  const [checkVerifyResult, setCheckVerifyResult] = useState(null); // 'approved' | 'restricted'

  // Specific state data for random events
  const [activeEventState, setActiveEventState] = useState(null);
  const [impatientRate, setImpatientRate] = useState(1);

  // Floating feedback states
  const [toastList, setToastList] = useState([]);
  const [floatList, setFloatList] = useState([]);
  const [comboList, setComboList] = useState([]);

  // DOM Input references
  const scannerInputRef = useRef(null);
  const cashReceivedRef = useRef(null);
  const supPasswordRef = useRef(null);
  const consultInputRef = useRef(null);
  const cpfInputRef = useRef(null);

  // Notification and toast helpers
  const triggerToast = (msg, cls) => {
    const id = generateRandomId();
    setToastList(prev => [...prev, { id, msg, cls }]);
    setTimeout(() => {
      setToastList(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const triggerFloatScore = (msg, color) => {
    const id = generateRandomId();
    const pos = generateRandomScorePosition();
    setFloatList(prev => [...prev, { id, msg, color, left: pos.left, top: pos.top }]);
    setTimeout(() => {
      setFloatList(prev => prev.filter(f => f.id !== id));
    }, 1700);
  };

  const triggerComboBadge = (val) => {
    const id = generateRandomId();
    setComboList(prev => [...prev, { id, val }]);
    setTimeout(() => {
      setComboList(prev => prev.filter(c => c.id !== id));
    }, 2000);
  };

  const addLog = (text, cls = 'le-info') => {
    const now = new Date();
    const t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    setLogs(prev => {
      const updated = [{ t, text, cls }, ...prev];
      if (updated.length > 30) updated.pop();
      return updated;
    });
  };

  const addStress = (n) => {
    const isFocoUnlocked = unlockedSkills.includes('scanner_rapido');
    const actualN = n > 0 && isFocoUnlocked ? Math.round(n * 0.8) : n;
    setStress(prev => {
      const nextStress = Math.max(0, Math.min(100, prev + actualN));
      if (nextStress >= 100) {
        setErrors(e => e + 1);
        setScore(s => Math.max(0, s - 30));
        setCombo(1);
        beepError();
        triggerToast('😵 COLAPSO! Respira. -30pts', 'toast-err');
        addLog('ESTRESSE: nível crítico -30pts', 'le-bad');
        return 65; // Reset stress to 65
      }
      return nextStress;
    });
  };

  // 1. Boot sequence simulation
  useEffect(() => {
    if (screen !== 'boot') return;
    const lines = [
      { t: 'SUPERMAIS SISTEMAS LTDA - PDV PRO v4.2.1', cls: '' },
      { t: '[BIOS] Hardware: OK', cls: 'ok' },
      { t: '[NET] Sincronização SEFAZ: OK', cls: 'ok' },
      { t: '[SYS] Sistema Pronto.', cls: 'ok' },
    ];
    setBootLines([]);
    lines.forEach((line, index) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, line]);
      }, index * 200);
    });
    setTimeout(() => {
      setScreen('login');
    }, 1500);
  }, [screen]);

  // First-time visit and save detection
  useEffect(() => {
    if (!hasLoaded) {
      if (isFirstTime()) {
        setShowTutorial(true);
        markAsVisited();
      } else if (hasExistingSave()) {
        setShowLoadModal(true);
      }
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
  };

  const handleLoadGame = () => {
    const savedGame = loadGameProgress();
    if (savedGame) {
      setOperatorName(savedGame.operatorName || '');
      setSelectedCareer(savedGame.selectedCareer || 0);
      setScore(savedGame.score || 0);
      setErrors(savedGame.errors || 0);
      setCombo(savedGame.combo || 1);
      setMaxCombo(savedGame.maxCombo || 1);
      setClientsDone(savedGame.clientsDone || 0);
      setTotalSecs(savedGame.totalSecs || 0);
      setStress(savedGame.stress || 0);
      setXp(savedGame.xp || 0);
      setLevel(savedGame.level || 1);
      setMissions(savedGame.missions || MISSIONS.map(m => ({ ...m, done: false })));
      setSessionTotal(savedGame.sessionTotal || 0);
      setCpf(savedGame.cpf || 'CONSUMIDOR NÃO IDENTIFICADO');
      setLogs(savedGame.logs || []);
      setMaxSecs(savedGame.maxSecs || 600);
      setUnlockedSkills(savedGame.unlockedSkills || []);
      
      setShowLoadModal(false);
      setScreen('title');
    }
  };

  const handleNewGame = () => {
    setShowLoadModal(false);
    clearGameProgress();
    setUnlockedSkills([]);
    setScreen('login');
  };

  // 2. Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setClockStr(`${h}:${m}:${s}`);
      setReceiptDateStr(`${now.toLocaleDateString('pt-BR')} ${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-save game progression
  useEffect(() => {
    if (screen === 'game' && operatorName && clientsDone > 0) {
      saveGameProgress({
        operatorName,
        selectedCareer,
        score,
        errors,
        combo,
        maxCombo,
        clientsDone,
        totalSecs,
        stress,
        xp,
        level,
        missions,
        sessionTotal,
        cpf,
        logs,
        maxSecs,
        unlockedSkills,
        savedAt: new Date().toLocaleString('pt-BR')
      });
    }
  }, [clientsDone, level, unlockedSkills]);

  // Level Up logic
  useEffect(() => {
    if (screen === 'game') {
      const nextLevel = Math.floor(score / 100) + 1;
      if (nextLevel > level) {
        setLevel(nextLevel);
        triggerToast(`🎉 NÍVEL UP! Você agora está no nível ${nextLevel}!`, 'toast-ok');
        addLog(`EVOLUÇÃO: Alcançou o Nível ${nextLevel}!`, 'le-good');
      }
    }
  }, [score, level, screen]);

  // 3. Gameplay active ticking
  useEffect(() => {
    if (screen !== 'game' || activeModal) return;

    const interval = setInterval(() => {
      setTotalSecs(prev => {
        const nextSec = prev + 1;
        if (nextSec >= maxSecs) {
          endGame();
          return prev;
        }
        return nextSec;
      });

      // Spawn customers randomly every 28 seconds
      if (totalSecs > 0 && totalSecs % 28 === 0) {
        setQueue(prev => {
          if (prev.length < 7) {
            return [...prev, generateNewCustomer()];
          }
          return prev;
        });
      }

      // Customer patience ticks
      if (currentCustomer && paymentMode !== 'processing') {
        setCustSecs(prevSecs => {
          const nextSecs = prevSecs + 1 * impatientRate;
          const isZenUnlocked = unlockedSkills.includes('paciencia_zen');
          const patience = currentCustomer.patience * (isZenUnlocked ? 1.2 : 1.0);
          const pct = Math.max(0, 100 - (nextSecs / patience) * 100);
          setCurrentCustomer(c => c ? { ...c, mood: pct } : null);

          if (pct < 25) {
            addStress(1);
          }

          if (nextSecs > patience + 30) {
            // Customer leaves
            beepAlert();
            triggerToast(`😡 ${currentCustomer.name} foi embora!`, 'toast-err');
            addLog(`CLIENTE DESISTIU: ${currentCustomer.name}`, 'le-bad');
            setErrors(e => e + 1);
            setCombo(1);
            setScore(s => Math.max(0, s - 40));
            addStress(22);
            spawnNextCustomer();
            return 0;
          }

          return nextSecs;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, activeModal, currentCustomer, totalSecs, paymentMode, unlockedSkills, impatientRate]);

  // 4. Mission checker hooks
  useEffect(() => {
    if (screen !== 'game') return;
    const stats = {
      clientsDone,
      errors,
      supCorrect,
      ageChecks: score > 0 ? 1 : 0, // Mock checking
      cashPayments: sessionTotal > 0 ? 1 : 0,
      wrongChange: 0,
      maxCombo,
    };

    setMissions(prev =>
      prev.map(mission => {
        if (mission.done) return mission;
        let isDone = false;
        if (mission.id === 'm1' && stats.clientsDone >= 5 && stats.errors === 0) isDone = true;
        if (mission.id === 'm2' && stats.supCorrect >= 3) isDone = true;
        if (mission.id === 'm3' && stats.clientsDone >= 2) isDone = true; // simplified mock verification
        if (mission.id === 'm4' && stats.clientsDone >= 4) isDone = true;
        if (mission.id === 'm5' && stats.maxCombo >= 5) isDone = true;
        if (mission.id === 'm6' && stats.errors === 0 && stats.clientsDone >= 3) isDone = true;
        if (mission.id === 'm7' && stats.clientsDone >= 10) isDone = true;

        if (isDone) {
          beepSuccess();
          triggerToast(`🎯 MISSÃO: ${mission.text} +${mission.pts}pts!`, 'toast-ok');
          addLog(`MISSÃO COMPLETA: ${mission.text} +${mission.pts}pts`, 'le-good');
          triggerFloatScore(`🎯+${mission.pts}pts`, 'var(--purple)');
          setScore(s => s + mission.pts);
          return { ...mission, done: true };
        }
        return mission;
      })
    );
  }, [screen, clientsDone, errors, supCorrect, maxCombo, score, sessionTotal]);

  // Auto focus scanner input when modal closes
  useEffect(() => {
    if (screen === 'game' && !activeModal) {
      setTimeout(() => scannerInputRef.current?.focus(), 50);
    }
  }, [screen, activeModal]);

  // 5. Game flow operations
  const handleQuickLogin = (user, pass) => {
    setLoginUser(user);
    setLoginPass(pass);
    setOperatorName(user.split('.')[0].toUpperCase());
    setScreen('abertura');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      setLoginStatus('ERRO: Preencha matrícula e senha.');
      return;
    }
    setLoginStatus('Autenticando...');
    setTimeout(() => {
      setOperatorName(loginUser.split('.')[0].toUpperCase());
      setScreen('abertura');
    }, 600);
  };

  const handleAberturaSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(aberturaVal.replace(',', '.')) || 0;
    setDrawerCash(val);
    setDrawerTransactions([{
      t: new Date().toLocaleTimeString('pt-BR'),
      type: 'ABERTURA',
      val: val,
      just: 'Fundo de troco inicial'
    }]);
    setScreen('title');
  };

  const handleStartGame = () => {
    // Initialize session state
    setScore(0);
    setErrors(0);
    setCombo(1);
    setMaxCombo(1);
    setClientsDone(0);
    setTotalSecs(0);
    setStress(0);
    setLogs([]);
    setMissions(MISSIONS.map(m => ({ ...m, done: false })));
    setCpf('CONSUMIDOR NÃO IDENTIFICADO');
    setSessionTotal(0);

    // Reset cash drawer
    const val = parseFloat(aberturaVal.replace(',', '.')) || 0;
    setDrawerCash(val);
    setDrawerTransactions([{
      t: new Date().toLocaleTimeString('pt-BR'),
      type: 'ABERTURA',
      val: val,
      just: 'Fundo de troco inicial'
    }]);

    // Reset event states
    setImpatientRate(1);
    setActiveEventState(null);
    setCheckVerifyStep(0);
    setCheckVerifyResult(null);

    // Set Max Secs depending on selected career difficulty
    const times = [600, 500, 400, 480, 300, 420];
    setMaxSecs(times[selectedCareer] || 600);

    // Initial customer spawn
    const initQueue = [];
    for (let i = 0; i < 3; i++) {
      initQueue.push(generateNewCustomer());
    }
    setQueue(initQueue);

    // Start turn
    setScreen('game');
    setActiveModal(null);
    setScannerInput('');
    setPendingQty(1);

    // Load first customer
    const firstCust = initQueue.shift();
    setQueue(initQueue);
    setCurrentCustomer(firstCust);
    setCustSecs(0);
    loadCustomerItems(firstCust);
    setCpf('CONSUMIDOR NÃO IDENTIFICADO');
    setActiveModal('cpf'); // Prompt CPF fiscal modal at checkout start

    addLog('TURNO INICIADO', 'le-info');
    triggerToast('Sistema pronto. Escaneie os produtos.', 'toast-info');
  };

  const generateNewCustomer = () => {
    const template = getRandomCustomer(CUSTOMERS);
    const seq = getRandomSequence();
    return {
      ...template,
      id: `#${seq}`,
      mood: 100,
    };
  };

  const loadCustomerItems = (cust) => {
    // Reset event-related states
    setImpatientRate(1);
    setActiveEventState(null);
    setCheckVerifyStep(0);
    setCheckVerifyResult(null);

    const count = getRandomItemCount();
    const items = [];
    for (let i = 0; i < count; i++) {
      const p = getRandomProduct(PRODUCTS);
      items.push({
        ...p,
        lineId: `${i}-${Date.now()}`,
        scanned: false,
        qty: 1,
      });
    }

    setScanItems([]);
    setRawTotal(0);
    setDiscount(0);
    setSupCalled(false);
    setNetDown(false);
    setCardFail(false);
    setCardFailed2(false);
    setAgeVerified(false);
    setCouponActive(false);
    setCouponVal(0);

    // Random events chance (45%)
    if (testRandomChance(0.45)) {
      const ev = getRandomCustomer(RANDOM_EVENTS);
      setActiveEvent(ev);
      if (ev.netDown) setNetDown(true);
      if (ev.cardFail) setCardFail(true);
      if (ev.coupon) {
        setCouponActive(true);
        setCouponVal(ev.coupon);
      }

      // Initialize specific states for new events:
      if (ev.id === 'impatient_customer') {
        setImpatientRate(2);
      }
      if (ev.id === 'payment_declined') {
        setCardFail(true);
      }
      if (ev.id === 'no_price' && items.length > 0) {
        // Replace first item with an item without a price label
        items[0] = {
          cod: '0000000000000',
          n: 'Item Sem Etiqueta',
          p: 0.00,
          cat: 'Mercearia',
          e: '❓',
          lineId: `noprice-${Date.now()}`,
          scanned: false,
          qty: 1,
          noPriceEvent: true
        };
      }
      if (ev.id === 'customer_question') {
        setActiveEventState({
          question: 'Este suco tem desconto no app da loja?',
          options: [
            { text: 'Sim, tem 10% de desconto', score: -10, comment: 'Cliente diz: "Mentira! Na gôndola diz que é Leve 3 Pague 2!"' },
            { text: 'Vou consultar o preço e promoção no terminal (F4)', score: 20, correct: true, comment: 'Você verifica no terminal e responde que é Leve 3 Pague 2! Cliente adora!' },
            { text: 'Não sei informar, chame o supervisor (F3)', score: 5, comment: 'Supervisor responde para o cliente. Resolvido sem problemas.' }
          ],
          resolved: false
        });
      }

      const delay = getRandomEventDelay();
      setTimeout(() => {
        triggerToast(ev.text.slice(0, 60), ev.type === 'error' ? 'toast-err' : ev.type === 'success' ? 'toast-ok' : 'toast-warn');
        addLog(`EVENTO: ${ev.text.slice(0, 50)}`, ev.type === 'success' ? 'le-good' : 'le-warn');
        setOdMode('ALERTA');
        setOdMain('ALERTA DO SISTEMA');
        setOdSub(ev.text);
        if (ev.type !== 'success') beepAlert();
        addStress(ev.stress || 10);

        // Event-specific triggers at delay time
        if (ev.id === 'register_error') {
          const leite = PRODUCTS.find(p => p.cod === '7891000300300'); // Leite
          const qty = 10;
          const lineTotal = leite.p * qty;
          setScanItems(prev => [...prev, {
            ...leite,
            lineId: `register-err-leite-${Date.now()}`,
            scanned: true,
            qty
          }]);
          setRawTotal(prev => prev + lineTotal);
          addLog(`SCAN ACIDENTAL: ${leite.n} x${qty} = R$${lineTotal.toFixed(2).replace('.', ',')}`, 'le-bad');
        }

        // Apply positive event points bonus
        if (ev.pts && ev.pts > 0 && ev.type === 'success') {
          setScore(s => s + ev.pts);
          triggerFloatScore(`+${ev.pts}pts`, 'var(--green)');
        }
      }, delay);
    } else {
      setActiveEvent(null);
    }

    setCurrentItems(items);
    setOdMode('VENDA');
    setOdMain(`CLIENTE: ${cust.name}`);
    setOdSub(`${items.length} itens na esteira | F1: Pagar`);
    setCdStatus('PASSE OS PRODUTOS');
    setCdWelcome(`OLÁ, ${cust.name.split(' ')[0].toUpperCase()}!`);
    setCdItem('');
    setCdTotalShow(false);
  };

  const spawnNextCustomer = () => {
    const nextQ = [...queue];
    if (nextQ.length === 0) {
      nextQ.push(generateNewCustomer());
    }
    const nextCust = nextQ.shift();
    setQueue(nextQ);
    setCurrentCustomer(nextCust);
    setCustSecs(0);
    loadCustomerItems(nextCust);
    setCpf('CONSUMIDOR NÃO IDENTIFICADO');
    setActiveModal('cpf');
  };

  // Keyboard and barcode scanner submission
  const handleScannerSubmit = (e) => {
    if (e) e.preventDefault();
    if (activeModal) return;

    let val = scannerInput.trim();
    setScannerInput('');

    if (!val) {
      scanNextItem();
      return;
    }

    let qty = 1;
    if (val.includes('*')) {
      const parts = val.split('*');
      qty = parseInt(parts[0]) || 1;
      val = parts[1] || '';
    } else if (val.toLowerCase().includes('x')) {
      const parts = val.toLowerCase().split('x');
      qty = parseInt(parts[0]) || 1;
      val = parts[1] || '';
    }

    const matchedProduct = PRODUCTS.find(p => p.cod === val || p.n.toLowerCase().includes(val.toLowerCase()));
    if (matchedProduct) {
      // Find unscanned copy on conveyor belt
      const conveyerItem = currentItems.find(i => i.cod === matchedProduct.cod && !i.scanned);
      if (conveyerItem) {
        scanItem(conveyerItem, qty, true); // true indicates manual entry
      } else {
        beepError();
        triggerToast('Item não está na esteira ou já escaneado!', 'toast-warn');
      }
    } else {
      beepError();
      addStress(5);
      setErrors(e => e + 1);
      setCombo(1);
      triggerToast('Código de barras inválido!', 'toast-err');
      addLog(`ERRO SCAN: código ${val} inválido`, 'le-bad');
    }
  };

  const scanNextItem = () => {
    if (activeModal) return;
    const nextItem = currentItems.find(i => !i.scanned);
    if (!nextItem) {
      beepAlert();
      triggerToast('Todos os itens já foram escaneados. Pressione F1.', 'toast-info');
      return;
    }

    // Age verification trigger
    if (nextItem.age && !ageVerified) {
      beepAlert();
      setActiveModal('age');
      return;
    }

    scanItem(nextItem, pendingQty, false); // false since space/conveyor click is scanner-based
    setPendingQty(1);
  };

  const scanItem = (item, qty, isManual = false) => {
    // Scanner com Falha Event check
    if (activeEvent?.id === 'scanner_fail' && !isManual) {
      beepError();
      addStress(4);
      triggerToast('ERRO: Scanner inoperante. Digite o código ou nome!', 'toast-err');
      addLog('SCANNER FALHOU: use digitação manual', 'le-bad');
      return;
    }

    // Produto Sem Preço Event check
    if (item.noPriceEvent && item.p === 0) {
      beepError();
      addStress(3);
      triggerToast('ERRO: Produto sem preço cadastrado! Consulte F4 ou F3.', 'toast-err');
      addLog('ERRO DE CADASTRO: produto sem preço na esteira', 'le-bad');
      return;
    }

    item.scanned = true;
    item.qty = qty;

    const lineTotal = item.p * qty;
    setRawTotal(prev => prev + lineTotal);
    setScanItems(prev => [...prev, { ...item, qty }]);

    // Beep / Visual flash
    beepScan();
    triggerFloatScore(`+${2 * combo}pts`, 'var(--green)');
    setScore(s => s + 2 * combo);

    // Updates displays
    setOdMode('LEITURA OK');
    setOdMain(`${item.e} ${item.n}`);
    setOdSub(`x${qty} = R$ ${lineTotal.toFixed(2).replace('.', ',')}`);
    setCdStatus('REGISTRANDO...');
    setCdItem(`${item.n} x${qty} = R$${lineTotal.toFixed(2).replace('.', ',')}`);
    setCdTotalShow(true);

    addLog(`SCAN: ${item.n} x${qty} = R$${lineTotal.toFixed(2).replace('.', ',')}`, 'le-good');

    // Update original list array reference
    setCurrentItems(prev => prev.map(i => (i.lineId === item.lineId ? { ...i, scanned: true } : i)));
  };

  // Numpad key handlers
  const handleNumpadNum = (val) => {
    setScannerInput(prev => prev + val);
    beep(440, 0.04, 0.1, 'square');
  };

  const handleNumpadClear = () => {
    setScannerInput('');
    setPendingQty(1);
    beep(300, 0.06, 0.15, 'square');
  };

  const handleNumpadQtd = () => {
    const num = parseInt(scannerInput) || 1;
    setPendingQty(num);
    setScannerInput('');
    beepAlert();
    triggerToast(`Quantidade multiplicada: ${num}x`, 'toast-info');
  };

  // Payment functions
  const openPayment = () => {
    if (scanItems.length === 0) {
      beepAlert();
      triggerToast('Escaneie ao menos um produto!', 'toast-warn');
      return;
    }
    if (activeEvent?.sup && !supCalled) {
      beepError();
      addStress(12);
      setErrors(e => e + 1);
      setCombo(1);
      triggerToast('⛔ PENDÊNCIA ABERTA — Chame supervisor antes (F3)', 'toast-err');
      return;
    }
    const ageRestrictedUnverified = currentItems.some(i => i.age && i.scanned) && !ageVerified;
    if (ageRestrictedUnverified) {
      beepError();
      setActiveModal('age');
      triggerToast('⛔ VERIFICAÇÃO DE IDADE PENDENTE', 'toast-err');
      return;
    }

    setPaymentMode('selecting');
    setActiveModal('payment');
  };

  const handlePaymentSelect = (method) => {
    if (netDown && method !== 'dinheiro') {
      beepError();
      triggerToast('Apenas dinheiro disponível (REDE FORA DO AR)', 'toast-err');
      return;
    }

    if (method === 'dinheiro') {
      if (activeEvent?.id === 'lack_of_change') {
        beepError();
        triggerToast('⛔ GAVETA SEM TROCO — Solicite suprimento (Sangria/Suprimento)', 'toast-err');
        return;
      }
      setPaymentMode('dinheiro');
      setCashReceived('');
      setCashChange(0);
      setTimeout(() => cashReceivedRef.current?.focus(), 150);
    } else if (method === 'voucher') {
      // Check if there are alcohol items
      const hasAlcohol = scanItems.some(i => i.restrict || i.age);
      if (hasAlcohol) {
        beepError();
        triggerToast('⛔ Vale-Alimentação não permite compra de álcool!', 'toast-err');
        addLog('RECUSADO: Vale-Alimentação com álcool no carrinho', 'le-bad');
        return;
      }
      setPaymentMode('processing');
      setProcessingMsg('PROCESSANDO VOUCHER...');
      setTimeout(() => {
        approveTransaction('voucher');
      }, 2000 + Math.random() * 1000);
    } else if (method === 'cheque') {
      setPaymentMode('cheque');
      setCheckVerifyStep(1);
      setCheckVerifyResult(null);
    } else {
      // TEF cards or PIX processing
      if (cardFail && !cardFailed2 && (method === 'debito' || method === 'credito')) {
        setCardFailed2(true);
        beepError();
        addStress(16);
        setErrors(e => e + 1);
        setCombo(1);
        triggerToast('💳 Cartão Recusado! Solicite outro método.', 'toast-err');
        addLog(`CARTÃO RECUSADO método:${method}`, 'le-bad');
        setPaymentMode('selecting');
        return;
      }

      setPaymentMode('processing');
      const msgs = { debito: 'PROCESSANDO DÉBITO...', credito: 'PROCESSANDO CRÉDITO...', pix: 'AGUARDANDO PIX...' };
      setProcessingMsg(msgs[method] || 'PROCESSANDO...');

      setTimeout(() => {
        approveTransaction(method);
      }, 2000 + Math.random() * 1000);
    }
  };

  const handleCashPaymentSubmit = (e) => {
    e.preventDefault();
    const promoDisc = getPromoDiscount(scanItems);
    const payTotal = Math.max(0, rawTotal - discount - promoDisc);
    const received = parseFloat(cashReceived.replace(',', '.')) || 0;

    if (received < payTotal) {
      beepError();
      triggerToast('Valor insuficiente!', 'toast-warn');
      return;
    }

    const change = received - payTotal;
    setCashChange(change);

    // Update drawer cash
    setDrawerCash(prev => prev + payTotal);
    setDrawerTransactions(prev => [...prev, {
      t: new Date().toLocaleTimeString('pt-BR'),
      type: 'VENDA_DINHEIRO',
      val: payTotal,
      just: `Venda cupom, troco R$ ${change.toFixed(2).replace('.', ',')}`
    }]);

    approveTransaction('dinheiro', change);
  };

  const approveTransaction = (method, change = 0) => {
    const promoDisc = getPromoDiscount(scanItems);
    const finalVal = Math.max(0, rawTotal - discount - promoDisc);
    setSessionTotal(prev => prev + finalVal);

    // Calculate score points awarded
    let pts = 30 + (combo > 1 ? 10 * (combo - 1) : 0);
    if (currentCustomer.mood > 75) pts += 15;
    else if (currentCustomer.mood < 30) pts -= 10;
    if (unlockedSkills.includes('bonus_gorjeta')) pts += 5;
    pts = Math.max(5, pts);

    setScore(s => s + pts);
    setClientsDone(c => c + 1);
    setCombo(prev => {
      const nextC = Math.min(15, prev + 1);
      if (nextC > maxCombo) setMaxCombo(nextC);
      return nextC;
    });

    addStress(-6);
    beepPay();

    // Trigger visual rewards
    triggerFloatScore(`+${pts}pts`, combo > 4 ? 'var(--amber)' : 'var(--green)');
    if (combo >= 3) triggerComboBadge(`x${combo}`);

    const methodLabels = { debito: 'DÉBITO', credito: 'CRÉDITO', pix: 'PIX', dinheiro: 'DINHEIRO', voucher: 'VALE-ALIMENTAÇÃO', cheque: 'CHEQUE' };
    const methodIcons = { debito: '💳', credito: '💳', pix: '📲', dinheiro: '💵', voucher: '🥗', cheque: '✍️' };

    setOdMode('VENDA CONCLUÍDA');
    setOdMain(`${methodIcons[method]} ${methodLabels[method]} OK`);
    setOdSub(`R$ ${finalVal.toFixed(2).replace('.', ',')} | Troco: R$ ${change.toFixed(2).replace('.', ',')}`);
    setCdStatus('PAGO! MUITO OBRIGADO!');
    setCdItem(`TOTAL PAGO: R$ ${finalVal.toFixed(2).replace('.', ',')}`);

    addLog(`PAGO: ${methodLabels[method]} R$ ${finalVal.toFixed(2).replace('.', ',')} | +${pts}pts`, 'le-good');
    triggerToast('Venda finalizada com sucesso!', 'toast-ok');

    // Summary modal
    setFinalSummary({
      total: finalVal,
      method: methodLabels[method],
      change,
    });
    setActiveModal('summary');
  };

  // Supervisor functionalities
  const callSupervisor = () => {
    const isSupRequired = activeEvent?.sup || 
                         activeEvent?.id === 'no_price' || 
                         activeEvent?.id === 'customer_question' || 
                         activeEvent?.id === 'return_item' ||
                         activeEvent?.id === 'register_error';

    if (!isSupRequired) {
      if (!activeEvent) {
        triggerToast('Nenhuma pendência para o supervisor.', 'toast-info');
      } else {
        triggerToast('Esta situação não requer supervisor.', 'toast-warn');
      }
      addStress(3);
      return;
    }

    // Supervisor called correctly
    setSupCalled(true);
    setSupCorrect(s => s + 1);
    setScore(s => s + 25);
    addStress(-8);
    setCombo(prev => Math.min(10, prev + 1));
    beepSuccess();
    triggerToast('Supervisor chamado com sucesso!', 'toast-ok');
    addLog('SUPERVISOR: chamado corretamente +25pts', 'le-good');
    triggerFloatScore('+25pts', 'var(--amber)');

    // Launch auth password modal
    setSupervisorError('');
    setSupervisorPassword(unlockedSkills.includes('supervisor_vip') ? 'super123' : '');
    setSupervisorTitle('PENDÊNCIA DE SUPERVISOR');

    // Define supervisor actions for different events
    if (activeEvent?.id === 'no_price') {
      setSupervisorAction(() => () => {
        setCurrentItems(prev => prev.map(i => i.noPriceEvent ? { ...i, p: 14.99, n: 'Item Sem Etiqueta (Liberado)' } : i));
        setActiveEvent(null);
        setActiveModal(null);
        setOdMode('VENDA');
        setOdMain('PREÇO LIBERADO');
        setOdSub('R$ 14,99 - Registre o produto.');
        addLog('SUPERVISOR: Preço R$ 14,99 liberado', 'le-info');
        triggerToast('Preço liberado pelo supervisor!', 'toast-ok');
      });
    } else if (activeEvent?.id === 'customer_question') {
      setSupervisorAction(() => () => {
        if (activeEventState) {
          setActiveEventState(prev => prev ? { ...prev, resolved: true } : null);
        }
        setActiveEvent(null);
        setActiveModal(null);
        setOdMode('VENDA');
        setOdMain(`CLIENTE: ${currentCustomer.name}`);
        setOdSub('Dúvida respondida pelo supervisor.');
        addLog('SUPERVISOR: respondeu dúvida do cliente', 'le-info');
        triggerToast('Supervisor respondeu ao cliente!', 'toast-ok');
      });
    } else if (activeEvent?.id === 'return_item') {
      setSupervisorAction(() => () => {
        setActiveModal(null);
        openReturnItemModal();
      });
    } else if (activeEvent?.id === 'register_error') {
      setSupervisorAction(() => () => {
        setActiveModal(null);
        const index = scanItems.findIndex(i => i.lineId.startsWith('register-err-leite'));
        if (index !== -1) {
          executeVoidItem(index);
          setActiveEvent(null);
        } else {
          triggerToast('Nenhum item de erro encontrado.', 'toast-warn');
        }
      });
    } else {
      // Default standard supervisor action
      setSupervisorAction(() => () => {
        setActiveEvent(null);
        setActiveModal(null);
        setOdMode('VENDA');
        setOdMain(`CLIENTE: ${currentCustomer.name}`);
        setOdSub('Pendência resolvida. Prossiga.');
        triggerToast('Pendência Autorizada', 'toast-ok');
      });
    }

    setActiveModal('supervisor');
  };

  const handleSupervisorAuthSubmit = (e) => {
    e.preventDefault();
    if (supervisorPassword === 'super123') {
      setActiveModal(null);
      if (supervisorAction) supervisorAction();
    } else {
      beepError();
      setSupervisorError('❌ SENHA INCORRETA');
      setSupervisorPassword('');
      supPasswordRef.current?.focus();
    }
  };

  const handleVoidItem = (index) => {
    setSupervisorError('');
    setSupervisorPassword(unlockedSkills.includes('supervisor_vip') ? 'super123' : '');
    setSupervisorTitle('CANCELAR ITEM');
    setSupervisorAction(() => () => {
      executeVoidItem(index);
    });
    setActiveModal('supervisor');
  };

  const executeVoidItem = (index) => {
    const removed = scanItems[index];
    const nextScanned = [...scanItems];
    nextScanned.splice(index, 1);
    setScanItems(nextScanned);

    // Revert scanner conveyor state
    setCurrentItems(prev =>
      prev.map(i => (i.lineId === removed.lineId ? { ...i, scanned: false } : i))
    );

    setRawTotal(prev => Math.max(0, prev - removed.p * removed.qty));
    setScore(s => Math.max(0, s - 5));
    beepAlert();
    triggerToast(`Item cancelado: ${removed.n}`, 'toast-warn');
    addLog(`CANCEL: ${removed.n}`, 'le-warn');
    setActiveModal(null);
  };

  const openReturnItemModal = () => {
    setActiveModal('return_item');
  };

  const voidLastItem = () => {
    if (scanItems.length === 0) {
      beepAlert();
      triggerToast('Nenhum item para cancelar!', 'toast-warn');
      return;
    }
    handleVoidItem(scanItems.length - 1);
  };

  const voidSale = () => {
    if (scanItems.length === 0) {
      triggerToast('Nenhum item escaneado.', 'toast-warn');
      return;
    }
    setSupervisorError('');
    setSupervisorPassword(unlockedSkills.includes('supervisor_vip') ? 'super123' : '');
    setSupervisorTitle('CANCELAR VENDA COMPLETA');
    setSupervisorAction(() => () => {
      setScanItems([]);
      setRawTotal(0);
      setDiscount(0);
      setCouponActive(false);

      // Reset conveyer scanned references
      setCurrentItems(prev => prev.map(i => ({ ...i, scanned: false })));

      beepAlert();
      setOdMode('LIVRE');
      setOdMain('VENDA CANCELADA');
      setOdSub('Aguardando próximo cliente');
      addLog('VENDA TOTAL CANCELADA', 'le-bad');
      triggerToast('Venda inteira cancelada', 'toast-err');
      setActiveModal(null);
    });
    setActiveModal('supervisor');
  };

  // Other shortcut operations
  const consultPrice = () => {
    setConsultInput('');
    setConsultResult(null);
    setActiveModal('consult');
  };

  const handleConsultSubmit = (e) => {
    e.preventDefault();
    const query = consultInput.toLowerCase();

    // Check if we are searching for the special no price item
    if (activeEvent?.id === 'no_price' && (query === '0000000000000' || query.includes('etiqueta') || query.includes('sem'))) {
      beepScan();
      setConsultResult({
        cod: '0000000000000',
        n: 'Item Sem Etiqueta (Gôndola)',
        priceStr: 'R$ 14,99',
        noPriceResolve: true
      });
      setConsultInput('');
      return;
    }

    const product = PRODUCTS.find(p => p.cod === consultInput || p.n.toLowerCase().includes(consultInput.toLowerCase()));
    if (product) {
      beepScan();
      setConsultResult({
        cod: product.cod,
        n: product.n,
        priceStr: `R$ ${product.p.toFixed(2).replace('.', ',')}`,
        stock: 12 + Math.floor(Math.random() * 20),
        aisle: product.dept || 1
      });
    } else {
      beepError();
      setConsultResult('NOT_FOUND');
    }
    setConsultInput('');
    consultInputRef.current?.focus();
  };

  const applyDiscount = () => {
    if (!couponActive) {
      triggerToast('Nenhum cupom de desconto ativo!', 'toast-warn');
      return;
    }
    setDiscount(couponVal);
    setCouponActive(false);
    beepSuccess();
    setScore(s => s + 8);
    triggerToast(`Desconto aplicado: -R$ ${couponVal.toFixed(2).replace('.', ',')}`, 'toast-ok');
    addLog(`DESCONTO: -R$ ${couponVal.toFixed(2)} aplicado`, 'le-good');
    triggerFloatScore(`-R$${couponVal.toFixed(2)}`, 'var(--green)');
  };

  const openSubstitution = () => {
    // Requires supervisor approval first
    setSupervisorError('');
    setSupervisorPassword(unlockedSkills.includes('supervisor_vip') ? 'super123' : '');
    setSupervisorTitle('AUTORIZAR SUBSTITUIÇÃO/TROCA');
    setSupervisorAction(() => () => {
      openReturnItemModal();
    });
    setActiveModal('supervisor');
  };

  const printReceiptBtn = () => {
    if (scanItems.length === 0) {
      triggerToast('Cupom vazio!', 'toast-warn');
      return;
    }
    beepScan();
    setScore(s => s + 2);
    triggerToast('🖨 CUPOM IMPRESSO — Entregue ao cliente', 'toast-ok');
    addLog('IMPRIMIU cupom fiscal', 'le-info');
  };

  const openSuspend = () => {
    beepAlert();
    setActiveModal('suspend');
  };

  const confirmSuspend = () => {
    setActiveModal(null);
    setScanItems([]);
    setRawTotal(0);
    setDiscount(0);
    setCouponActive(false);
    setCurrentItems([]);
    addLog('VENDA SUSPENSA cod:4471', 'le-warn');
    triggerToast('Venda suspensa. Chame próximo cliente.', 'toast-warn');
    spawnNextCustomer();
  };

  const openDrawerOperations = () => {
    beepAlert();
    setSangriaSuprimentoTab('suprimento');
    setSangriaSuprimentoVal('');
    setSangriaSuprimentoJust('');
    setActiveModal('drawer_operations');
  };

  const handleDrawerOperationSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(sangriaSuprimentoVal.replace(',', '.')) || 0;
    if (val <= 0) {
      beepError();
      triggerToast('Insira um valor válido!', 'toast-warn');
      return;
    }

    if (sangriaSuprimentoTab === 'sangria') {
      if (val > drawerCash) {
        beepError();
        triggerToast('Valor superior ao disponível na gaveta!', 'toast-err');
        return;
      }
      setDrawerCash(prev => prev - val);
      setDrawerTransactions(prev => [...prev, {
        t: new Date().toLocaleTimeString('pt-BR'),
        type: 'SANGRIA',
        val: val,
        just: sangriaSuprimentoJust || 'Retirada de caixa'
      }]);
      beepSuccess();
      setScore(s => s + 10);
      triggerToast(`Sangria de R$ ${val.toFixed(2).replace('.', ',')} efetuada!`, 'toast-ok');
      addLog(`SANGRIA: -R$ ${val.toFixed(2).replace('.', ',')} retirados`, 'le-warn');
    } else {
      setDrawerCash(prev => prev + val);
      setDrawerTransactions(prev => [...prev, {
        t: new Date().toLocaleTimeString('pt-BR'),
        type: 'SUPRIMENTO',
        val: val,
        just: sangriaSuprimentoJust || 'Reforço de gaveta'
      }]);
      beepSuccess();
      setScore(s => s + 10);
      triggerToast(`Suprimento de R$ ${val.toFixed(2).replace('.', ',')} efetuado!`, 'toast-ok');
      addLog(`SUPRIMENTO: +R$ ${val.toFixed(2).replace('.', ',')} adicionados`, 'le-good');

      // Clear lack of change event if resolved
      if (activeEvent?.id === 'lack_of_change') {
        setActiveEvent(null);
        triggerToast('Falta de troco resolvida!', 'toast-ok');
        addLog('EVENTO CONCLUÍDO: Falta de troco resolvida', 'le-good');
      }
    }
    setActiveModal(null);
  };

  // Keyboard shortcut routing
  useEffect(() => {
    if (screen !== 'game') return;

    const handleGlobalShortcuts = (e) => {
      // Allow esc closing on modals
      if (activeModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeModal();
        }
        return;
      }

      // Ignore if focus is in text input
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT') return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          openPayment();
          break;
        case 'F2':
          e.preventDefault();
          voidLastItem();
          break;
        case 'F3':
          e.preventDefault();
          callSupervisor();
          break;
        case 'F4':
          e.preventDefault();
          consultPrice();
          break;
        case 'F5':
          e.preventDefault();
          applyDiscount();
          break;
        case 'F6':
          e.preventDefault();
          openSubstitution();
          break;
        case 'F7':
          e.preventDefault();
          printReceiptBtn();
          break;
        case 'F8':
          e.preventDefault();
          openSuspend();
          break;
        case 'F9':
          e.preventDefault();
          voidSale();
          break;
        case 'F10':
          e.preventDefault();
          openDrawerOperations();
          break;
        case ' ':
          e.preventDefault();
          scanNextItem();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [screen, activeModal, scanItems, currentItems, ageVerified, activeEvent, rawTotal, discount]);

  const closeModal = () => {
    setActiveModal(null);
    if (activeModal === 'age') {
      // Recuse restricted item since we closed verification
      handleAgeVerify(false);
    }
  };

  const handleAgeVerify = (approved) => {
    setActiveModal(null);
    if (approved) {
      setAgeVerified(true);
      setScore(s => s + 10);
      beepSuccess();
      triggerToast('✓ IDADE VERIFICADA', 'toast-ok');
      addLog('VERIFICAÇÃO ETÁRIA: aprovado', 'le-good');
      triggerFloatScore('+10pts', 'var(--amber)');

      // Automatically scan the pending age restricted item
      const item = currentItems.find(i => i.age && !i.scanned);
      if (item) {
        scanItem(item, pendingQty);
        setPendingQty(1);
      }
    } else {
      // Remove age restricted item from conveyor
      const restrictedIndex = currentItems.findIndex(i => i.age && !i.scanned);
      if (restrictedIndex !== -1) {
        setCurrentItems(prev => {
          const nextItems = [...prev];
          nextItems.splice(restrictedIndex, 1);
          return nextItems;
        });
      }
      beepAlert();
      triggerToast('⚠ VENDA RECUSADA — Item removido da esteira', 'toast-warn');
      addLog('VENDA RECUSADA: menor de idade/sem documento', 'le-warn');
    }
  };

  // Close Register & End Turn
  const handleCloseRegisterTrigger = () => {
    if (scanItems.length > 0) {
      triggerToast('Finalize ou cancele a venda atual antes de fechar!', 'toast-warn');
      return;
    }
    beepAlert();
    setCashCountVal('');
    const reportText = generateClosureReportText('LEITURA X');
    setClosureReport(reportText);
    setActiveModal('closure');
  };

  const generateClosureReportText = (type = 'LEITURA X') => {
    const now = new Date();
    const trans = drawerTransactions;
    const salesCash = trans.filter(t => t.type === 'VENDA_DINHEIRO').reduce((acc, t) => acc + t.val, 0);
    const suprimentos = trans.filter(t => t.type === 'SUPRIMENTO' || t.type === 'ABERTURA').reduce((acc, t) => acc + t.val, 0);
    const sangrias = trans.filter(t => t.type === 'SANGRIA').reduce((acc, t) => acc + t.val, 0);
    const finalExpected = suprimentos + salesCash - sangrias;

    return `========================================
        SUPERMAIS SUPERMERCADOS
           RELATÓRIO FISCAL - ${type}
========================================
DATA: ${now.toLocaleDateString('pt-BR')}   HORA: ${now.toLocaleTimeString('pt-BR')}
CAIXA: 03          OPERADOR: ${operatorName}
----------------------------------------
(-) FUNDO DE ABERTURA:   R$ ${parseFloat(aberturaVal).toFixed(2).replace('.', ',')}
(+) DEPOSITOS (SUPRIM.): R$ ${suprimentos.toFixed(2).replace('.', ',')}
(-) SANGRIA (RETIRADA):  R$ ${sangrias.toFixed(2).replace('.', ',')}
(+) VENDAS DINHEIRO:     R$ ${salesCash.toFixed(2).replace('.', ',')}
----------------------------------------
(=) VALOR ESPERADO CAIXA R$ ${finalExpected.toFixed(2).replace('.', ',')}
========================================`;
  };

  const handleClosureSubmit = (e) => {
    e.preventDefault();
    const count = parseFloat(cashCountVal.replace(',', '.')) || 0;
    const expected = drawerCash;
    const diff = count - expected;

    let ptsChange = 0;
    if (Math.abs(diff) < 0.01) {
      ptsChange = 50;
      addLog('FECHAMENTO: Caixa conciliado com 100% de acerto. +50pts', 'le-good');
      triggerToast('Caixa fechado com 100% de acerto! +50 XP', 'toast-ok');
    } else if (diff > 0) {
      ptsChange = -10;
      addLog(`FECHAMENTO: Sobra de R$ ${diff.toFixed(2).replace('.', ',')} na gaveta. -10pts`, 'le-warn');
      triggerToast(`Sobra de R$ ${diff.toFixed(2).replace('.', ',')} identificada.`, 'toast-warn');
    } else {
      ptsChange = -30;
      addLog(`FECHAMENTO: Falta de R$ ${Math.abs(diff).toFixed(2).replace('.', ',')} na gaveta! -30pts`, 'le-bad');
      triggerToast(`Falta de R$ ${Math.abs(diff).toFixed(2).replace('.', ',')} identificada!`, 'toast-err');
    }

    beepSuccess();
    endGame(count, diff, ptsChange);
  };

  const endGame = (counted = null, discrepancy = 0, ptsChange = 0) => {
    beepSuccess();
    beepSuccess();

    // Grade classification
    const finalScore = Math.max(0, score + ptsChange);
    const g = finalScore >= 900 ? 'S' : finalScore >= 600 ? 'A' : finalScore >= 380 ? 'B' : finalScore >= 200 ? 'C' : 'D';
    const titles = { S: 'OPERADOR LENDA!', A: 'EXCELENTE TURNO!', B: 'BOM TRABALHO!', C: 'TURNO REGULAR', D: 'PRECISA TREINAR' };
    const subs = {
      S: 'Desempenho excepcional. Candidato a promoção.',
      A: 'Acima da média. Continue assim!',
      B: 'Dentro do esperado.',
      C: 'Vários erros identificados.',
      D: 'Revise os procedimentos.',
    };

    setFinalSummary({
      grade: g,
      title: titles[g],
      desc: subs[g],
      clients: clientsDone,
      errs: errors + (discrepancy < 0 ? 1 : 0),
      maxC: maxCombo,
      vendas: sessionTotal,
      score: finalScore,
      drawerExpected: drawerCash,
      drawerCounted: counted,
      discrepancy: discrepancy
    });
    setScreen('result');
    setActiveModal(null);
  };

  const renderSkillTree = () => {
    return (
      <div className="skill-tree-overlay">
        <div className="skill-tree-modal">
          <div className="skill-tree-header">
            <h2 className="skill-tree-title">⚙️ ÁRVORE DE HABILIDADES</h2>
            <div className="skill-tree-points">
              <span>⭐ Pontos:</span>
              <strong>{score} pts</strong>
            </div>
          </div>
          
          <div className="skill-tree-grid">
            {SKILL_TREE.map(skill => {
              const isPurchased = unlockedSkills.includes(skill.id);
              const canAfford = score >= skill.cost;
              
              return (
                <div key={skill.id} className={`skill-card ${isPurchased ? 'purchased' : canAfford ? 'affordable' : ''}`}>
                  <div className="skill-card-top">
                    <span className="skill-icon">{skill.icon}</span>
                    <span className="skill-name">{skill.name}</span>
                  </div>
                  <p className="skill-desc">{skill.desc}</p>
                  <div className="skill-action">
                    {isPurchased ? (
                      <button className="btn-skill owned" disabled>✓ ADQUIRIDA</button>
                    ) : canAfford ? (
                      <button 
                        className="btn-skill buy" 
                        onClick={() => {
                          setScore(s => s - skill.cost);
                          setUnlockedSkills(prev => [...prev, skill.id]);
                          beepSuccess();
                          triggerToast(`🔓 Habilidade desbloqueada: ${skill.name}!`, 'toast-ok');
                        }}
                      >
                        DESBLOQUEAR (-{skill.cost} pts)
                      </button>
                    ) : (
                      <button className="btn-skill locked" disabled>BLOQUEADO ({skill.cost} pts)</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="skill-tree-footer">
            <button className="btn-skill-close" onClick={() => {
              setShowSkillTree(false);
              // Save progress when closing the skill tree
              saveGameProgress({
                operatorName, selectedCareer, score, errors, combo, maxCombo,
                clientsDone, totalSecs, stress, xp, level, missions, sessionTotal,
                cpf, logs, maxSecs, unlockedSkills,
                savedAt: new Date().toLocaleString('pt-BR')
              });
            }}>
              FECHAR E SALVAR PROGRESSO
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Layout Renderings
  if (showTutorial) {
    return (
      <Tutorial 
        onComplete={handleTutorialComplete} 
        onSkip={handleTutorialSkip} 
      />
    );
  }

  if (showLoadModal) {
    return (
      <LoadGameModal 
        onLoad={handleLoadGame} 
        onNewGame={handleNewGame} 
      />
    );
  }

  if (screen === 'boot') {
    return (
      <div id="screen-boot" className="screen active">
        <div className="boot-lines">
          {bootLines.map((line, i) => (
            <div key={i} className={`boot-line ${line.cls}`}>
              {line.t}
            </div>
          ))}
          <div className="boot-cursor"></div>
        </div>
      </div>
    );
  }

  if (screen === 'login') {
    return (
      <div id="screen-login" className="screen active">
        <div className="login-box">
          <div className="login-header">
            <div className="login-logo">CAIXEIRO PRO</div>
            <div className="login-version">v2.0 — PORTAL OPERADOR</div>
          </div>
          <div className="login-body">
            <div className="login-corp">
              <div className="login-corp-name">SUPERMAIS S/A</div>
              <div className="login-corp-sub">CENTRO DE DISTRIBUIÇÃO E VAREJO</div>
            </div>
            <div className="login-preset">
              <div className="preset-btn" onClick={() => handleQuickLogin('admin.silva', '1234')}>Admin</div>
              <div className="preset-btn" onClick={() => handleQuickLogin('op01.lima', '1234')}>OP 01</div>
              <div className="preset-btn" onClick={() => handleQuickLogin('op02.souza', '1234')}>OP 02</div>
            </div>
            <form onSubmit={handleLoginSubmit}>
              <div className="login-field">
                <label>MATRÍCULA / OPERADOR</label>
                <input
                  type="text"
                  placeholder="ex: admin.silva"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                />
              </div>
              <div className="login-field">
                <label>SENHA DE ACESSO</label>
                <input
                  type="password"
                  placeholder="••••"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                />
              </div>
              <button type="submit" className="login-btn">
                ENTRAR NO SISTEMA
              </button>
            </form>
            <div className="login-status">{loginStatus}</div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'abertura') {
    return (
      <div className="overlay">
        <form className="modal" onSubmit={handleAberturaSubmit}>
          <h2>ABERTURA DE CAIXA</h2>
          <p style={{ color: '#475569', marginBottom: '20px', fontSize: '14px' }}>
            Informe o fundo de troco inicial da gaveta:
          </p>
          <div className="input-group">
            <label>VALOR DE ABERTURA (DINHEIRO)</label>
            <input
              autoFocus
              type="text"
              value={aberturaVal}
              onChange={e => setAberturaVal(e.target.value)}
              placeholder="100,00"
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '1px' }}
            />
          </div>
          <button type="submit" className="btn">
            CONFIRMAR ABERTURA E ABRIR GAVETA
          </button>
        </form>
      </div>
    );
  }

  if (screen === 'title') {
    return (
      <div id="screen-title" className="screen active">
        <div className="title-bg"></div>
        <div className="title-glow"></div>
        <div className="title-logo">
          <div className="logo-top">CAIXEIRO <span>PRO</span></div>
          <div className="logo-sub">SIMULADOR DE SUPERMERCADO</div>
        </div>
        <div className="title-product-row">
          <div className="title-product">🛒</div>
          <div className="title-product">🍞</div>
          <div className="title-product">🥛</div>
          <div className="title-product">💳</div>
          <div className="title-product">🧾</div>
        </div>
        <div className="title-buttons">
          <button className="btn-big primary" onClick={() => setScreen('career')}>
            ▶ INICIAR NOVO TURNO
          </button>
          <button className="btn-big secondary" onClick={() => setScreen('career')}>
            📊 MUDAR CARREIRA / SHIFT
          </button>
          <button className="btn-big" style={{ background: 'var(--purple)', color: 'white', marginTop: '12px' }} onClick={() => setShowSkillTree(true)}>
            🔑 ÁRVORE DE HABILIDADES
          </button>
        </div>
        <div className="title-version">v2.0 — Operador: {operatorName}</div>
        {showSkillTree && renderSkillTree()}
      </div>
    );
  }

  if (screen === 'career') {
    const shifts = [
      { name: 'MANHÃ', desc: 'Turno tranquilo, fila moderada. Ideal para treinar.', stars: '★★☆☆☆', diff: '25%', color: 'var(--green)' },
      { name: 'TARDE', desc: 'Movimento intenso, promoções, clientes exigentes.', stars: '★★★☆☆', diff: '55%', color: 'var(--yellow)' },
      { name: 'NOITE', desc: 'Sistema instável, cliente difícil, falhas na rede.', stars: '★★★★★', diff: '90%', color: 'var(--red)' },
      { name: 'FIM DE SEMANA', desc: 'Fila enorme, carrinhos lotados, cupons.', stars: '★★★★☆', diff: '80%', color: 'var(--orange)' },
      { name: 'NATAL (PICO)', desc: 'Desafio supremo, stress acelerado, loucura.', stars: '★★★★★', diff: '100%', color: 'var(--purple)' },
      { name: 'GERENTE SUBSTITUTO', desc: 'Trocas constantes, fiscalização de idade.', stars: '★★★★☆', diff: '75%', color: 'var(--teal)' },
    ];

    return (
      <div id="screen-career" className="screen active">
        <div className="career-title">ESCOLHA O TURNO</div>
        <div className="career-sub">Cada turno tem desafios e eventos diferentes</div>
        <div className="career-grid">
          {shifts.map((shift, idx) => (
            <div
              key={idx}
              className={`career-card ${selectedCareer === idx ? 'selected' : ''}`}
              onClick={() => setSelectedCareer(idx)}
            >
              <div className="career-icon">{['🌅', '🌞', '🌙', '🛒', '🎄', '💼'][idx]}</div>
              <div className="career-name">{shift.name}</div>
              <div className="career-desc">{shift.desc}</div>
              <div className="career-stars">{shift.stars}</div>
              <div className="difficulty-bar">
                <div className="difficulty-fill" style={{ width: shift.diff, background: shift.color }}></div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button className="btn-start-career" onClick={handleStartGame}>
            INICIAR TURNO SELECIONADO
          </button>
          <button className="btn-back" onClick={() => setScreen('title')}>
            VOLTAR AO MENU
          </button>
        </div>
      </div>
    );
  }

  // Active Gameplay Panel
  if (screen === 'game') {
    const displayTotal = Math.max(0, rawTotal - discount).toFixed(2);
    const getCatClass = (cat) => {
      const map = {
        'Mercearia': 'cat-mercearia',
        'Laticínio': 'cat-laticinio',
        'Padaria': 'cat-padaria',
        'Açougue': 'cat-acougue',
        'Limpeza': 'cat-limpeza',
        'Higiene': 'cat-higiene',
        'Bebidas': 'cat-bebida',
      };
      return map[cat] || '';
    };

    return (
      <div id="screen-game" className="screen active">
        {/* Toast Notification Stack */}
        <div className="notif-stack">
          {toastList.map(t => (
            <div key={t.id} className={`notif ${t.cls === 'toast-ok' ? 'n-good' : t.cls === 'toast-err' ? 'n-bad' : t.cls === 'toast-warn' ? 'n-warn' : 'n-info'}`}>
              {t.msg}
            </div>
          ))}
        </div>

        {/* Floating Scores */}
        {floatList.map(f => (
          <div key={f.id} className="float-score" style={{ left: `${f.left}%`, top: `${f.top}%`, color: f.color }}>
            {f.msg}
          </div>
        ))}

        {/* Combo displays */}
        <div className="combo-display">
          {comboList.map(c => (
            <div key={c.id} className="combo-badge" style={{ background: 'var(--amber)', color: '#000' }}>
              COMBO {c.val}
            </div>
          ))}
        </div>

        {/* Header Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="level-badge">LVL {level}</div>
            <div className="shift-name">OP: {operatorName} | CAIXA 03</div>
          </div>
          <div className="topbar-center">
            <div className="timer-display urgent">
              {String(Math.floor((maxSecs - totalSecs) / 60)).padStart(2, '0')}:
              {String((maxSecs - totalSecs) % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="topbar-right">
            <div className="stat-pill">
              <span className="sp-icon">⭐</span>
              <span className="sp-val">{score}</span>
              <span className="sp-lbl">PONTOS</span>
            </div>
            <div className="stat-pill">
              <span className="sp-icon">❌</span>
              <span className="sp-val">{errors}</span>
              <span className="sp-lbl">ERROS</span>
            </div>
          </div>
        </div>

        {/* Stress Bar */}
        <div className="stress-area">
          <div className="stress-label">ESTRESSE:</div>
          <div className="stress-track">
            <div className="stress-bar" style={{ width: `${stress}%`, background: stress < 40 ? 'var(--green)' : stress < 70 ? 'var(--yellow)' : 'var(--red)' }}></div>
          </div>
          <div className="stress-pct">{stress}%</div>
        </div>

        {/* XP Progress Bar */}
        <div className="xp-area">
          <div className="xp-label">XP:</div>
          <div className="xp-track">
            <div className="xp-bar" style={{ width: `${(score % 100)}%` }}></div>
          </div>
          <div className="xp-txt">{(score % 100)} / 100</div>
        </div>

        {/* Game Workspace Grid */}
        <div className="game-body">
          <div className="left-panel">
            {/* Conveyer Belt Section */}
            <div className="conveyor-section">
              <div className="section-header">
                <div className="section-title">ESTEIRA DE PRODUTOS</div>
                <div className="section-badge">{currentItems.filter(i => !i.scanned).length} RESTANTES</div>
              </div>
              <div className="scanner-beam"></div>
              <div className="conveyor-belt">
                {currentItems.filter(i => !i.scanned).length === 0 ? (
                  <div style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px', width: '100%', textAlign: 'center' }}>
                    ✅ Todos os itens escaneados
                  </div>
                ) : (
                  currentItems.filter(i => !i.scanned).map(item => (
                    <div
                      key={item.lineId}
                      className={`product-item ${getCatClass(item.cat)} ${item.age && unlockedSkills.includes('olho_clinico') ? 'highlight-age-restrict' : ''}`}
                      onClick={() => {
                        if (item.age && !ageVerified) {
                          beepAlert();
                          setActiveModal('age');
                        } else {
                          scanItem(item, pendingQty);
                          setPendingQty(1);
                        }
                      }}
                    >
                      <span className="pi-emoji">{item.e}</span>
                      <span className="pi-name">{item.n}</span>
                      <span className="pi-price">R$ {item.p.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Checkout Receipt section */}
            <div className="register-section">
              <div className="section-header">
                <div className="section-title">CUPOM FISCAL EMITIDO</div>
              </div>
              <div className="register-list">
                {scanItems.length === 0 ? (
                  <div style={{ padding: '20px', color: 'var(--muted)', fontSize: '11px', textAlign: 'center', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    -- AGUARDANDO ITENS --
                  </div>
                ) : (
                  scanItems.map((item, index) => (
                    <div className="register-item" key={index}>
                      <span className="ri-num">{String(index + 1).padStart(3, '0')}</span>
                      <span className="ri-name">{item.e} {item.n}</span>
                      <span className="ri-qty">{item.qty > 1 ? `${item.qty}x` : ''}</span>
                      <span className="ri-price">R$ {(item.p * item.qty).toFixed(2).replace('.', ',')}</span>
                      <button className="ri-del" onClick={() => handleVoidItem(index)}>✕</button>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal displays */}
              {scanItems.length > 0 && (
                <div style={{ display: 'block', borderTop: '1px solid var(--border)', background: 'var(--surface2)', padding: '10px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span>Subtotal</span>
                    <span>R$ {rawTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                      <span>Desconto</span>
                      <span>-R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px', opacity: 0.7 }}>
                    <span>Impostos aprox.</span>
                    <span>R$ {(parseFloat(displayTotal) * 0.12).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}

              {/* Receipt Total Footer */}
              <div className="total-bar">
                <div className="total-label">VALOR TOTAL DA COMPRA</div>
                <div className="total-val">R$ {displayTotal.replace('.', ',')}</div>
              </div>
              <span id="cpf-nota-display" style={{ padding: '0 16px 12px', display: 'block', background: 'var(--surface2)' }}>
                {cpf}
              </span>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="actions-section">
              <button className="action-btn btn-pay" onClick={openPayment}>
                💳 PAGAR COMPRA <span className="btn-key">F1</span>
              </button>
              <button className="action-btn btn-void" onClick={voidLastItem}>
                ❌ ESTORNAR ÚLTIMO <span className="btn-key">F2</span>
              </button>
              <button className="action-btn btn-super" onClick={callSupervisor}>
                📋 VER PENDÊNCIA / SUPERVISOR <span className="btn-key">F3</span>
              </button>
              <button className="action-btn" onClick={consultPrice}>
                🔍 BUSCAR PREÇO <span className="action-label"><span className="btn-key">F4</span></span>
              </button>
              <button className="action-btn" onClick={applyDiscount}>
                🎫 APLICAR CUPOM <span className="btn-key">F5</span>
              </button>
              <button className="action-btn" onClick={openSubstitution}>
                🔄 SUBSTITUIÇÃO ITEM <span className="btn-key">F6</span>
              </button>
              <button className="action-btn" onClick={printReceiptBtn}>
                🖨 IMPRIMIR CUPOM <span className="btn-key">F7</span>
              </button>
              <button className="action-btn" onClick={openSuspend}>
                ⏸ SUSPENDER COMPRA <span className="btn-key">F8</span>
              </button>
              <button className="action-btn btn-void" style={{ gridColumn: 'span 2' }} onClick={voidSale}>
                ⛔ CANCELAR VENDA COMPLETA <span className="btn-key">F9</span>
              </button>
            </div>

            {/* Active Alert Event notifications */}
            {activeEvent && (
              <div className={`event-section ${activeEvent.type === 'error' ? 'ev-error' : activeEvent.type === 'warn' ? 'ev-warn' : activeEvent.type === 'info' ? 'ev-info' : 'ev-neutral'}`}>
                <div className="ev-header">
                  <span className="ev-type">{activeEvent.type.toUpperCase()}</span>
                </div>
                <div className="ev-text">{activeEvent.text}</div>
                {activeEvent.sup && !supCalled && (
                  <button className="ev-action-btn" onClick={callSupervisor}>
                    CHAMAR SUPERVISOR PARA RESOLVER
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Status Information Sidebar */}
          <div className="right-panel">
            {/* Customer Patience Info */}
            {currentCustomer && (
              <div className="customer-area">
                <div className="customer-header">
                  <div className="customer-avi">{currentCustomer.avi}</div>
                  <div className="customer-info">
                    <div className="customer-name">{currentCustomer.name}</div>
                    <div className={`customer-type type-${currentCustomer.type}`}>
                      {currentCustomer.type.toUpperCase()}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '8px' }}>
                  {currentCustomer.profile}
                </p>
                <div className="patience-label">
                  <span>PACIÊNCIA:</span>
                  <span>{Math.round(currentCustomer.mood)}%</span>
                </div>
                <div className="patience-track">
                  <div
                    className="patience-fill"
                    style={{ width: `${currentCustomer.mood}%`, background: currentCustomer.mood > 60 ? 'var(--green)' : currentCustomer.mood > 30 ? 'var(--yellow)' : 'var(--red)' }}
                  ></div>
                </div>
                <div className="wait-time">TEMPO DE ESPERA: {custSecs}s</div>
              </div>
            )}

            {/* Conveyer line queue status */}
            <div className="queue-area">
              <div className="queue-title">CLIENTES NA FILA ({queue.length})</div>
              <div className="queue-list">
                {queue.length === 0 ? (
                  <div className="empty-queue">Ninguém na fila</div>
                ) : (
                  queue.map((cust, idx) => (
                    <div key={idx} className="queue-person">
                      <span className="qp-num">{idx + 1}</span>
                      <span className="qp-avi">{cust.avi}</span>
                      <span className="qp-name">{cust.name}</span>
                      <span className="qp-mood">😊</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Checklist achievements missions */}
            <div className="missions-area">
              <div className="missions-title">MISSÕES DO TURNO</div>
              <div className="missions-list">
                {missions.map(mission => (
                  <div className="mission-item" key={mission.id}>
                    <div className={`mission-check ${mission.done ? 'done' : ''}`}>{mission.done ? '✓' : ''}</div>
                    <div className={`mission-text ${mission.done ? 'done' : ''}`}>{mission.text}</div>
                    <div className="mission-pts">+{mission.pts}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Turn Logs */}
            <div className="log-area">
              <div className="log-title">LOG DO SISTEMA (PDV)</div>
              <div className="log-list">
                {logs.map((log, idx) => (
                  <div key={idx} className={`log-entry ${log.cls}`}>
                    <span>{log.t}</span>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Keyboard scanner interface */}
            <div className="scanner-container">
              <form className="scanner-form" onSubmit={handleScannerSubmit}>
                <input
                  ref={scannerInputRef}
                  type="text"
                  className="scanner-input"
                  placeholder={pendingQty > 1 ? `${pendingQty}x [Digite código do item...]` : 'Digite o código ou nome...'}
                  value={scannerInput}
                  onChange={e => setScannerInput(e.target.value)}
                />
                <button type="submit" className="scanner-btn">
                  OK
                </button>
              </form>
              <div className="funckeys" style={{ marginTop: '10px' }}>
                <button className="fk" onClick={() => handleNumpadQtd()}>
                  <span className="fk-key">QTD</span>
                  <span className="fk-label">Multiplicador</span>
                </button>
                <button className="fk" onClick={() => handleNumpadClear()}>
                  <span className="fk-key">CLR</span>
                  <span className="fk-label">Limpar buffer</span>
                </button>
                <button className="fk" style={{ gridColumn: 'span 2' }} onClick={handleCloseRegisterTrigger}>
                  <span className="fk-key">FECHAR TURNO</span>
                  <span className="fk-label">Concluir</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Modals renders */}
        {activeModal === 'payment' && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar green">
                <div className="modal-title">FINALIZAR VENDA</div>
                <div className="modal-sub">MODO DE PAGAMENTO COMPRA</div>
              </div>
              <div className="modal-body">
                <div className="mw-total-display">
                  <div className="mw-total-label">TOTAL A PAGAR</div>
                  <div className="mw-total-val">R$ {displayTotal.replace('.', ',')}</div>
                  <div className="mw-total-items">{scanItems.length} itens no cupom</div>
                </div>

                {discount > 0 && (
                  <div className="mw-discount-line">🎫 Cupom Desconto aplicado: -R$ {discount.toFixed(2).replace('.', ',')}</div>
                )}

                {paymentMode === 'selecting' && (
                  <div className="pay-grid">
                    <div className="pay-opt" onClick={() => handlePaymentSelect('debito')}>
                      <span className="po-icon">💳</span>
                      <span className="po-name">DÉBITO</span>
                      <span className="po-sub">Cartão TEF</span>
                    </div>
                    <div className="pay-opt" onClick={() => handlePaymentSelect('credito')}>
                      <span className="po-icon">💳</span>
                      <span className="po-name">CRÉDITO</span>
                      <span className="po-sub">Cartão TEF</span>
                    </div>
                    <div className="pay-opt" onClick={() => handlePaymentSelect('pix')}>
                      <span className="po-icon">📲</span>
                      <span className="po-name">PIX QR CODE</span>
                      <span className="po-sub">Instantâneo</span>
                    </div>
                    <div className="pay-opt" onClick={() => handlePaymentSelect('dinheiro')}>
                      <span className="po-icon">💵</span>
                      <span className="po-name">DINHEIRO</span>
                      <span className="po-sub">Espécie física</span>
                    </div>
                  </div>
                )}

                {paymentMode === 'processing' && (
                  <div className="processing-view">
                    <div className="proc-spinner"></div>
                    <div className="proc-text">{processingMsg}</div>
                    <div className="proc-sub">Aguardando resposta do TEF...</div>
                  </div>
                )}

                {paymentMode === 'dinheiro' && (
                  <form className="cash-calculator" onSubmit={handleCashPaymentSubmit}>
                    <div className="calc-label">VALOR FISICAMENTE RECEBIDO</div>
                    <div className="calc-display">
                      <input
                        ref={cashReceivedRef}
                        className="calc-input"
                        type="text"
                        placeholder="0,00"
                        value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-big primary" style={{ width: '100%', background: 'var(--green)' }}>
                      CONFIRMAR RECEBIMENTO
                    </button>
                  </form>
                )}

                <button className="modal-close" onClick={closeModal}>
                  CANCELAR PAGAMENTO (ESC)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'supervisor' && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar amber">
                <div className="modal-title">{supervisorTitle}</div>
                <div className="modal-sub">AUTENTICAÇÃO SUPERVISOR PDV</div>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSupervisorAuthSubmit}>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', marginBottom: '16px' }}>
                    Esta operação exige credenciais de um supervisor para liberação (Senha padrão: super123).
                  </p>
                  <input
                    ref={supPasswordRef}
                    type="password"
                    placeholder="SENHA"
                    value={supervisorPassword}
                    onChange={e => setSupervisorPassword(e.target.value)}
                    style={{ width: '100%', padding: '15px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', textAlign: 'center', fontSize: '28px', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <div style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>
                    {supervisorError}
                  </div>
                  <button type="submit" className="btn-big primary" style={{ width: '100%', marginTop: '16px', background: 'var(--amber)' }}>
                    CONFIRMAR AUTORIZAÇÃO
                  </button>
                </form>
                <button className="modal-close" onClick={closeModal}>
                  FECHAR E CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'consult' && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar blue">
                <div className="modal-title">CONSULTA DE PREÇOS</div>
                <div className="modal-sub">SUPERMAIS PDV PRO</div>
              </div>
              <div className="modal-body">
                <form onSubmit={handleConsultSubmit}>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', textAlign: 'center' }}>
                    Digite o código de barras ou o nome do produto.
                  </p>
                  <input
                    ref={consultInputRef}
                    type="text"
                    placeholder="CÓDIGO OU NOME..."
                    value={consultInput}
                    onChange={e => setConsultInput(e.target.value)}
                    style={{ width: '100%', padding: '14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', textAlign: 'center', fontSize: '18px', outline: 'none' }}
                  />
                </form>

                <div style={{ marginTop: '20px', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', borderRadius: '12px', border: '1px dashed var(--border)', padding: '16px' }}>
                  {consultResult === null && (
                    <span style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>AGUARDANDO LEITURA...</span>
                  )}
                  {consultResult === 'NOT_FOUND' && (
                    <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>PRODUTO NÃO ENCONTRADO</span>
                  )}
                  {consultResult && typeof consultResult === 'object' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>{consultResult.cod}</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{consultResult.n}</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {consultResult.priceStr}
                      </div>
                    </div>
                  )}
                </div>

                <button className="modal-close" onClick={closeModal}>
                  FECHAR CONSULTA (ESC)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'cpf' && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar blue">
                <div className="modal-title">CPF NA NOTA</div>
                <div className="modal-sub">IDENTIFICAÇÃO CONSUMIDOR</div>
              </div>
              <div className="modal-body">
                {!showCpfField ? (
                  <div className="cpf-options">
                    <div className="cpf-card" onClick={() => {
                      setShowCpfField(true);
                      setTimeout(() => cpfInputRef.current?.focus(), 150);
                    }}>
                      <span className="cc-icon">🆔</span>
                      <span className="cc-label">INFORMAR CPF</span>
                      <span className="cc-sub">Consumidor Identificado</span>
                    </div>
                    <div className="cpf-card" onClick={() => {
                      setCpf('CONSUMIDOR NÃO IDENTIFICADO');
                      setActiveModal(null);
                    }}>
                      <span className="cc-icon">⏩</span>
                      <span className="cc-label">NÃO INFORMAR</span>
                      <span className="cc-sub">Prosseguir Direto</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: 'var(--surface2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                        DIGITE O CPF DO CLIENTE
                      </label>
                      <input
                        ref={cpfInputRef}
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpfInputVal}
                        onChange={e => setCpfInputVal(e.target.value)}
                        style={{ width: '100%', padding: '18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', textAlign: 'center', fontSize: '24px', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                      />
                      <button
                        className="btn-big primary"
                        style={{ width: '100%', marginTop: '16px' }}
                        onClick={() => {
                          setCpf(cpfInputVal ? `CPF/CNPJ Consumidor: ${cpfInputVal}` : 'CONSUMIDOR NÃO IDENTIFICADO');
                          setShowCpfField(false);
                          setCpfInputVal('');
                          setActiveModal(null);
                        }}
                      >
                        ✓ CONFIRMAR CPF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeModal === 'age' && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar amber">
                <div className="modal-title">VERIFICAÇÃO ETÁRIA</div>
                <div className="modal-sub">PRODUTO RESTRITO PARA MENORES</div>
              </div>
              <div className="modal-body">
                <div className="age-verify-display">
                  <div className="avd-title">🔞 PRODUTO RESTRITO</div>
                  <div className="avd-sub">VENDA PROIBIDA PARA MENORES DE 18 ANOS</div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', textAlign: 'center', lineHeight: '1.6' }}>
                  Solicite documento de identificação original com foto. Verifique a data de nascimento.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <button className="btn-big primary" style={{ background: 'var(--green)' }} onClick={() => handleAgeVerify(true)}>
                    ✓ COMPROVADO MAIOR (+18 anos)
                  </button>
                  <button className="btn-big secondary" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleAgeVerify(false)}>
                    ✗ MENOR / RECUSADO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'suspend' && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar amber">
                <div className="modal-title">SUSPENDER VENDA</div>
                <div className="modal-sub">SUPERMAIS PDV PRO</div>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.8', textAlign: 'center', marginBottom: '16px' }}>
                  Suspender esta venda salvará os itens no banco de dados temporário.
                  <br />
                  Uma senha de recuperação será impressa para reativação.
                </div>
                <div style={{ fontSize: '32px', textAlign: 'center', margin: '20px 0', color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}>
                  SENHA: 4471
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-big primary" style={{ flex: 1, background: 'var(--amber)' }} onClick={confirmSuspend}>
                    CONFIRMAR SUSPENSÃO
                  </button>
                  <button className="btn-big secondary" style={{ flex: 1 }} onClick={closeModal}>
                    CANCELAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'summary' && finalSummary && (
          <div className="overlay">
            <div className="modal-box">
              <div className="modal-title-bar green">
                <div className="modal-title">VENDA CONCLUÍDA</div>
                <div className="modal-sub">EXTRATO OPERAÇÃO</div>
              </div>
              <div className="modal-body">
                <div className="summary-card" style={{ marginBottom: '16px' }}>
                  <span className="sc-icon" style={{ fontSize: '64px', marginBottom: '12px', display: 'block' }}>✅</span>
                  <div className="sc-title">CUPOM EMITIDO</div>
                  <div className="sc-val">R$ {finalSummary.total.toFixed(2).replace('.', ',')}</div>
                  <div className="sc-troco">
                    {finalSummary.change > 0 ? (
                      <span>TROCO FISCAL GAVETA: <strong>R$ {finalSummary.change.toFixed(2).replace('.', ',')}</strong></span>
                    ) : (
                      <span>PAGAMENTO VIA {finalSummary.method}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-big primary"
                  style={{ width: '100%', background: 'var(--green)' }}
                  onClick={() => {
                    setActiveModal(null);
                    setFinalSummary(null);
                    spawnNextCustomer();
                  }}
                >
                  ATENDER PRÓXIMO CLIENTE (ENTER)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Result display
  if (screen === 'result' && finalSummary) {
    const achs = [];
    if (finalSummary.errs === 0) achs.push({ t: '🏆 SEM ERROS', c: 'gold' });
    if (finalSummary.maxC >= 5) achs.push({ t: '🔥 COMBO MASTER', c: 'gold' });
    if (finalSummary.clients >= 8) achs.push({ t: '⭐ VETERANO', c: 'silver' });
    if (supCorrect >= 3) achs.push({ t: '📋 PROTOCOLO', c: 'silver' });
    if (finalSummary.vendas > 100) achs.push({ t: '💰 COLECIONADOR', c: 'bronze' });
    if (stress <= 20) achs.push({ t: '😌 NERVO DE AÇO', c: 'bronze' });

    return (
      <div id="screen-result" className="screen active">
        <div className={`result-grade ${finalSummary.grade}`}>{finalSummary.grade}</div>
        <div className="result-title">{finalSummary.title}</div>
        <div className="result-score">R$ {finalSummary.score.toLocaleString('pt-BR')}</div>
        <div className="result-pts-label">TURNO FINALIZADO COM SUCESSO</div>

        <div className="result-stats">
          <div className="result-stat">
            <div className="rs-val" style={{ color: 'var(--accent)' }}>{finalSummary.clients}</div>
            <div className="rs-lbl">CLIENTES</div>
          </div>
          <div className="result-stat">
            <div className="rs-val" style={{ color: 'var(--red)' }}>{finalSummary.errs}</div>
            <div className="rs-lbl">ERROS</div>
          </div>
          <div className="result-stat">
            <div className="rs-val" style={{ color: 'var(--yellow)' }}>{finalSummary.maxC}</div>
            <div className="rs-lbl">MAX COMBO</div>
          </div>
          <div className="result-stat">
            <div className="rs-val" style={{ color: 'var(--green)' }}>R$ {finalSummary.vendas.toFixed(0)}</div>
            <div className="rs-lbl">RECEITA</div>
          </div>
        </div>

        <div className="result-achievements">
          {achs.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Nenhuma conquista extra neste turno</div>
          ) : (
            achs.map((a, i) => (
              <div key={i} className={`achievement ${a.c}`}>
                {a.t}
              </div>
            ))
          )}
        </div>

        <div className="result-buttons">
          <button className="btn-big primary" onClick={() => setScreen('career')}>
            MUDAR TURNO / NOVO JOGO
          </button>
          <button className="btn-big secondary" onClick={() => setScreen('title')}>
            IR PARA O MENU
          </button>
        </div>
      </div>
    );
  }

  return null;
}
