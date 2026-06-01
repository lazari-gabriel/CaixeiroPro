import { CUSTOMERS, RANDOM_EVENTS, MISSIONS } from './gameData';

// 1. Expanded Customers
export const ENHANCED_CUSTOMERS = [
  ...CUSTOMERS,
  {
    name: 'Chef Jacquin',
    avi: '👨‍🍳',
    type: 'picky',
    patience: 50,
    profile: 'Chef de cozinha francês exigente. Compra ingredientes finos e reclama de qualquer demora.'
  },
  {
    name: 'Influenciador Digital',
    avi: '🤳',
    type: 'rush',
    patience: 40,
    profile: 'Faz live enquanto passa as compras. Fica distraído mostrando os produtos para a câmera.'
  },
  {
    name: 'Sr. Wilson',
    avi: '👴',
    type: 'slow',
    patience: 120,
    profile: 'Adora bater papo sobre o clima e a economia. Atrasa a fila de propósito para conversar.'
  },
  {
    name: 'Garota Fitness',
    avi: '🏃‍♀️',
    type: 'normal',
    patience: 80,
    profile: 'Só compra laticínios light e bebidas. Super educada e paga sempre com aproximação celular.'
  }
];

// 2. Expanded Events with positive interactions and challenges
export const ENHANCED_RANDOM_EVENTS = [
  ...RANDOM_EVENTS,
  {
    id: 'tip_generous',
    text: 'CLIENTE SATISFEITO: Dona Rosa adorou seu atendimento e te deu uma gorjeta! +35 pontos.',
    type: 'success',
    stress: -15,
    sup: false,
    pts: 35
  },
  {
    id: 'manager_compliment',
    text: 'ELOGIO DO GERENTE: O gerente do supermercado elogiou sua velocidade. Estresse reduzido e bônus de XP!',
    type: 'success',
    stress: -25,
    sup: false,
    pts: 20
  },
  {
    id: 'round_change',
    text: 'TROCO ARREDONDADO: O cliente diz "deixe o troco de moedas para você". +15 pontos.',
    type: 'success',
    stress: -5,
    sup: false,
    pts: 15
  },
  {
    id: 'easy_barcode',
    text: 'CUPOM AUTOMÁTICO: O aplicativo do cliente gerou um desconto automático na tela do PDV! -R$ 5,00.',
    type: 'info',
    stress: -2,
    sup: false,
    coupon: 5,
    pts: 10
  },
  {
    id: 'scanner_fail',
    text: 'SCANNER COM FALHA: O leitor de código de barras parou de responder! Digite os códigos manualmente no teclado ou busque pelo nome.',
    type: 'error',
    stress: 15,
    sup: false,
    pts: 0
  },
  {
    id: 'no_price',
    text: 'PRODUTO SEM PREÇO: O produto na esteira está sem etiqueta de preço. Busque o preço (F4) ou chame o supervisor (F3) para cadastrar.',
    type: 'warn',
    stress: 12,
    sup: false,
    pts: 10
  },
  {
    id: 'return_item',
    text: 'TROCA OU DEVOLUÇÃO: O cliente quer devolver um item já registrado. Use F6 (Substituição de Item) e chame o supervisor.',
    type: 'warn',
    stress: 15,
    sup: true,
    pts: 0
  },
  {
    id: 'payment_declined',
    text: 'PAGAMENTO RECUSADO: O cartão de crédito do cliente foi recusado pela operadora. Solicite outro método.',
    type: 'error',
    stress: 20,
    sup: false,
    pts: 0
  },
  {
    id: 'customer_question',
    text: 'DÚVIDA DO CLIENTE: O cliente pergunta se o suco tem desconto no app. Consulte preço/estoque (F4) ou chame o supervisor (F3).',
    type: 'info',
    stress: 10,
    sup: false,
    pts: 0
  },
  {
    id: 'register_error',
    text: 'ERRO DE REGISTRO: Você registrou 10x de um produto por engano no cupom fiscal. Use F2 para estornar o item.',
    type: 'warn',
    stress: 15,
    sup: true,
    pts: 0
  },
  {
    id: 'lack_of_change',
    text: 'FALTA DE TROCO: O caixa está sem moedas de troco. Realize um Suprimento de Caixa na gaveta para prosseguir.',
    type: 'warn',
    stress: 18,
    sup: false,
    pts: 0
  },
  {
    id: 'impatient_customer',
    text: 'CLIENTE IMPACIENTE: O cliente está com muita pressa! Sua paciência cai 2x mais rápido. Atenda rápido ou use "Acalmar" para ganhar tempo.',
    type: 'warn',
    stress: 15,
    sup: false,
    pts: 0
  }
];

// 3. New Missions
export const ENHANCED_MISSIONS = [
  ...MISSIONS,
  {
    id: 'm8',
    text: 'Subir de nível durante o turno',
    pts: 100,
    done: false
  },
  {
    id: 'm9',
    text: 'Desbloquear pelo menos 1 Habilidade',
    pts: 80,
    done: false
  },
  {
    id: 'm10',
    text: 'Chegar a 500 pontos sem ter colapsos de estresse',
    pts: 150,
    done: false
  }
];

// 4. Skill Tree Progression System
export const SKILL_TREE = [
  {
    id: 'paciencia_zen',
    name: 'Paciência Zen',
    desc: 'Os clientes têm +20% mais paciência na fila e no atendimento.',
    cost: 150,
    icon: '🧘‍♂️',
    multiplier: 1.2
  },
  {
    id: 'scanner_rapido',
    name: 'Foco Aumentado',
    desc: 'Reduz o acúmulo de estresse por erros ou lentidão em 20%.',
    cost: 200,
    icon: '🧘',
    multiplier: 0.8
  },
  {
    id: 'supervisor_vip',
    name: 'Supervisor Amigo',
    desc: 'A senha do supervisor é pré-preenchida de forma automática.',
    cost: 250,
    icon: '🔑',
    multiplier: 1
  },
  {
    id: 'bonus_gorjeta',
    name: 'Bônus de Simpatia',
    desc: 'Ganha +5 pontos extras a cada cliente finalizado com sucesso.',
    cost: 300,
    icon: '💰',
    multiplier: 5
  },
  {
    id: 'olho_clinico',
    name: 'Olho Clínico',
    desc: 'Destaca produtos restritos (bebidas alcoólicas) na esteira.',
    cost: 180,
    icon: '👁️',
    multiplier: 1
  }
];

// 5. Difficulty presets for turns
export const DIFFICULTY_SETTINGS = {
  0: { patienceModifier: 1.0, stressSpeed: 1.0, eventChance: 0.35 }, // MANHÃ
  1: { patienceModifier: 0.9, stressSpeed: 1.1, eventChance: 0.45 }, // TARDE
  2: { patienceModifier: 0.8, stressSpeed: 1.3, eventChance: 0.60 }, // NOITE
  3: { patienceModifier: 0.85, stressSpeed: 1.2, eventChance: 0.50 }, // FIM DE SEMANA
  4: { patienceModifier: 0.7, stressSpeed: 1.5, eventChance: 0.75 }, // NATAL
  5: { patienceModifier: 0.9, stressSpeed: 1.1, eventChance: 0.50 }  // GERENTE SUBSTITUTO
};
