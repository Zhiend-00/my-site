/**
 * Клавиатурные сокращения для читалки
 */

export const KEYBOARD_SHORTCUTS = {
  // Навигация
  PREV_PAGE: ['ArrowLeft', 'a', 'A'],
  NEXT_PAGE: ['ArrowRight', 'd', 'D'],
  PREV_CHAPTER: ['PageUp', 'ArrowUp', 'w', 'W'],
  NEXT_CHAPTER: ['PageDown', 'ArrowDown', 's', 'S'],
  
  // Управление
  TOGGLE_FULLSCREEN: ['f', 'F'],
  TOGGLE_READING_MODE: ['m', 'M'],
  TOGGLE_DIRECTION: ['r', 'R'],
  TOGGLE_BOOKMARK: ['b', 'B'],
  OPEN_SETTINGS: ['o', 'O'],
  
  // Масштаб
  ZOOM_IN: ['+', '='],
  ZOOM_OUT: ['-', '_'],
  RESET_ZOOM: ['0'],
  
  // Прочее
  ESCAPE: ['Escape'],
  SPACE: [' ']
}

/**
 * Проверяет, является ли нажатая клавиша одним из указанных сокращений
 */
export const isShortcut = (event, shortcuts) => {
  return shortcuts.includes(event.key)
}

/**
 * Создает подсказку по горячим клавишам
 */
export const createShortcutsHelp = () => {
  return {
    title: 'Горячие клавиши',
    shortcuts: [
      { keys: ['←', '→', 'A', 'D'], action: 'Листать страницы' },
      { keys: ['↑', '↓', 'W', 'S'], action: 'Листать главы' },
      { keys: ['F'], action: 'Полноэкранный режим' },
      { keys: ['M'], action: 'Сменить режим чтения' },
      { keys: ['R'], action: 'Сменить направление' },
      { keys: ['B'], action: 'Добавить/убрать закладку' },
      { keys: ['+', '-', '0'], action: 'Увеличить/уменьшить/сбросить масштаб' },
      { keys: ['Esc'], action: 'Выйти из полноэкранного режима' },
      { keys: ['Пробел'], action: 'Следующая страница' }
    ]
  }
}

/**
 * Отображает подсказку по горячим клавишам
 */
export const showShortcutsHelp = () => {
  const help = createShortcutsHelp()
  
  // Здесь можно реализовать отображение модального окна с подсказками
  console.log('Подсказка по горячим клавишам:', help)
  
  // Для временного решения - выводим в консоль
  console.table(help.shortcuts.map(s => ({
    'Клавиши': s.keys.join(', '),
    'Действие': s.action
  })))
}