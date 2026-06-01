import { getSaveInfo } from '../utils/storage';

export default function LoadGameModal({ onLoad, onNewGame }) {
  const saveInfo = getSaveInfo();

  return (
    <div className="overlay" style={{ zIndex: 99999 }}>
      <div className="load-modal-box">
        <div className="load-modal-header">
          <h2 className="load-modal-title">RECUPERAÇÃO DE SESSÃO</h2>
          <span className="load-modal-sub">JOGO SALVO ENCONTRADO</span>
        </div>
        <div className="load-modal-body">
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
            Identificamos um progresso salvo anteriormente neste dispositivo. Deseja retomar o seu turno ou iniciar uma nova jornada?
          </p>

          {saveInfo && (
            <div className="save-summary-card">
              <div className="save-info-row">
                <span className="save-info-label">Operador</span>
                <span className="save-info-value">{saveInfo.operatorName}</span>
              </div>
              <div className="save-info-row">
                <span className="save-info-label">Nível de Carreira</span>
                <span className="save-info-value">LVL {saveInfo.level}</span>
              </div>
              <div className="save-info-row">
                <span className="save-info-label">Pontuação Total</span>
                <span className="save-info-value">{saveInfo.score} pts</span>
              </div>
              <div className="save-info-row">
                <span className="save-info-label">Último Turno</span>
                <span className="save-info-value">{saveInfo.careerName}</span>
              </div>
              <div className="save-info-row">
                <span className="save-info-label">Salvo em</span>
                <span className="save-info-value" style={{ fontSize: '11px' }}>{saveInfo.savedAt}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn"
              style={{ background: 'var(--green)', fontSize: '16px', fontWeight: 'bold', padding: '15px' }}
              onClick={onLoad}
            >
              🔄 CONTINUAR DE ONDE PAROU
            </button>
            <button
              className="btn"
              style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '14px', padding: '12px' }}
              onClick={() => {
                if (confirm('Aviso: Isso apagará permanentemente o jogo salvo atual. Deseja continuar?')) {
                  onNewGame();
                }
              }}
            >
              ⚠️ INICIAR NOVO TURNO (APAGAR SALVE)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
