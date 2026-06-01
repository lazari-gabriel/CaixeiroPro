import { useState, useEffect } from 'react';

const steps = [
  {
    title: 'Bem-vindo, Operador!',
    selector: null,
    content: (
      <>
        <p>Este é o <strong>Caixeiro Pro</strong>, um simulador interativo de operação de caixa de supermercado.</p>
        <p>Seu objetivo é registrar compras rapidamente, atender os clientes com eficiência e evitar erros que aumentem o estresse ou resultem em quebras de caixa.</p>
      </>
    ),
  },
  {
    title: 'Esteira de Produtos',
    selector: '.conveyor-section',
    content: (
      <>
        <p>Aqui na <strong>Esteira</strong> surgem os produtos trazidos pelos clientes.</p>
        <p>Você pode <strong>clicar diretamente em cada produto</strong> para registrá-lo ou digitar o nome/código de barras no scanner. Fique atento aos produtos que passam!</p>
      </>
    ),
  },
  {
    title: 'Leitor e Teclado do PDV',
    selector: '.scanner-container',
    content: (
      <>
        <p>Aqui fica o seu <strong>Painel do Scanner</strong>.</p>
        <p>Você pode digitar o código ou nome de um produto e clicar em <strong>OK</strong>. Use <strong>QTD</strong> para passar múltiplos itens (ex: digitar 5, clicar em QTD e escanear o produto).</p>
      </>
    ),
  },
  {
    title: 'Cupom Fiscal Emitido',
    selector: '.register-section',
    content: (
      <>
        <p>À medida que registra os itens, eles aparecem no <strong>Cupom Fiscal</strong> com quantidades e subtotais.</p>
        <p>Cometeu um erro? Clique em <strong>✕</strong> no item correspondente ou use o atalho <strong>F2</strong> para cancelar o último item (requer a senha do supervisor: <code>super123</code>).</p>
      </>
    ),
  },
  {
    title: 'Estresse e XP do Operador',
    selector: '.topbar',
    content: (
      <>
        <p>Monitore seus indicadores no topo da tela:</p>
        <ul>
          <li><strong>Estresse</strong>: Aumenta quando clientes esperam demais ou ocorrem erros. Se atingir 100%, você terá um colapso e perderá pontos!</li>
          <li><strong>XP e Nível</strong>: Acumule pontos para subir de nível e ganhar moedas de progresso para a Árvore de Habilidades.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Finalização e Pagamento',
    selector: '.action-btn.btn-pay',
    content: (
      <>
        <p>Quando escanear todos os produtos, clique em <strong>PAGAR COMPRA</strong> ou pressione <strong>F1</strong>.</p>
        <p>Escolha o método (Cartão, Pix ou Dinheiro). Se for dinheiro, digite o valor recebido e o sistema mostrará o troco exato a ser entregue.</p>
      </>
    ),
  },
];

export default function Tutorial({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightCoords, setSpotlightCoords] = useState(null);

  useEffect(() => {
    const selector = steps[currentStep].selector;
    if (!selector) {
      const timerId = setTimeout(() => setSpotlightCoords(null), 0);
      return () => clearTimeout(timerId);
    }

    const updateSpotlight = () => {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setSpotlightCoords(null);
      }
    };

    const timerId = setTimeout(updateSpotlight, 50);
    window.addEventListener('resize', updateSpotlight);
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <>
      {spotlightCoords && (
        <div
          style={{
            position: 'absolute',
            top: spotlightCoords.top - 6,
            left: spotlightCoords.left - 6,
            width: spotlightCoords.width + 12,
            height: spotlightCoords.height + 12,
            boxShadow: '0 0 0 99999px rgba(15, 23, 42, 0.8), 0 0 20px rgba(56, 189, 248, 0.8)',
            border: '3px solid var(--accent2)',
            borderRadius: '16px',
            zIndex: 99998,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      <div className="tutorial-overlay">
        <div className="tutorial-box" style={{ zIndex: 99999 }}>
          <div className="tutorial-header">
            <h3 className="tutorial-title">
              <span>📖</span> {steps[currentStep].title}
            </h3>
            <span className="tutorial-step-indicator">
              Passo {currentStep + 1} de {steps.length}
            </span>
          </div>

          <div className="tutorial-body">
            {steps[currentStep].content}
          </div>

          <div className="tutorial-footer">
            <button className="btn-tut skip" onClick={onSkip}>
              Pular Tutorial
            </button>
            <div className="tutorial-buttons">
              {currentStep > 0 && (
                <button className="btn-tut secondary" onClick={handlePrev}>
                  Anterior
                </button>
              )}
              <button className="btn-tut primary" onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Iniciar Treinamento' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
