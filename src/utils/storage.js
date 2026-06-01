const SAVE_KEY = 'caixeiro_pro_save';
const VISITED_KEY = 'caixeiro_pro_visited';

export function saveGameProgress(gameState) {
  try {
    const serialized = JSON.stringify(gameState);
    localStorage.setItem(SAVE_KEY, serialized);
  } catch (err) {
    console.error('Erro ao salvar progresso:', err);
  }
}

export function loadGameProgress() {
  try {
    const serialized = localStorage.getItem(SAVE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (err) {
    console.error('Erro ao carregar progresso:', err);
    return null;
  }
}

export function clearGameProgress() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error('Erro ao limpar progresso:', err);
  }
}

export function isFirstTime() {
  try {
    return !localStorage.getItem(VISITED_KEY);
  } catch {
    return true;
  }
}

export function markAsVisited() {
  try {
    localStorage.setItem(VISITED_KEY, 'true');
  } catch (err) {
    console.error('Erro ao marcar como visitado:', err);
  }
}

export function hasExistingSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function getSaveInfo() {
  const save = loadGameProgress();
  if (!save) return null;
  return {
    operatorName: save.operatorName || 'OPERADOR',
    level: save.level || 1,
    score: save.score || 0,
    careerName: save.selectedCareer !== undefined ? getCareerName(save.selectedCareer) : 'Nenhum',
    savedAt: save.savedAt || new Date().toLocaleString('pt-BR')
  };
}

function getCareerName(idx) {
  const shifts = ['MANHÃ', 'TARDE', 'NOITE', 'FIM DE SEMANA', 'NATAL (PICO)', 'GERENTE SUBSTITUTO'];
  return shifts[idx] || 'Desconhecido';
}
