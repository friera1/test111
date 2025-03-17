import { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type Language = 'ru' | 'en';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  ru: {
    // Header
    title: "GameStats Hub",
    home: "Главная",
    rankings: "Рейтинг игроков",
    allianceRankings: "Топ альянсы",
    logout: "Выйти",
    
    // Authentication
    registration: "Регистрация",
    username: "Имя пользователя",
    email: "Email",
    password: "Пароль",
    registerButton: "Зарегистрироваться",
    alreadyHaveAccount: "Уже есть аккаунт?",
    loginLink: "Войти",
    login: "Вход",
    usernameOrEmail: "Имя пользователя или Email",
    loginButton: "Войти",
    noAccount: "Нет аккаунта?",
    registerLink: "Зарегистрироваться",
    
    // Game connection
    gameConnection: "Подключение к игре",
    gameId: "ID игрока",
    gameNick: "Никнейм в игре",
    connectGame: "Подключить",
    
    // Profile
    profile: "Профиль",
    editProfile: "Редактировать профиль",
    gameStats: "Статистика игры",
    characterName: "Имя персонажа",
    server: "Сервер",
    alliance: "Альянс",
    level: "Уровень",
    currentPower: "Текущая мощь",
    maxPower: "Историческая мощь",
    hiddenPower: "Скрытая мощь",
    editAlliance: "Изменить альянс",
    newAlliance: "Новый альянс",
    cancel: "Отмена",
    save: "Сохранить",
    
    // Rankings
    playerRankings: "Рейтинг игроков",
    all: "Все",
    sortBy: "Сортировать по",
    order: "Порядок",
    descending: "По убыванию",
    ascending: "По возрастанию",
    rank: "Ранг",
    name: "Имя",
    totalResults: "Всего игроков: {count}",
    
    // Alliance rankings
    totalPower: "Общая мощь",
    memberCount: "Участников",
    averagePower: "Средняя мощь",
    totalAllianceResults: "Всего альянсов: {count}",
    
    // Footer
    copyright: "© 2023 GameStats Hub. Все права защищены.",
    
    // Notifications
    profileUpdated: "Профиль обновлен",
    allianceUpdated: "Альянс обновлен",
    gameDataFetched: "Данные игры получены",
    updateGameData: "Обновить данные"
  },
  en: {
    // Header
    title: "GameStats Hub",
    home: "Home",
    rankings: "Player Rankings",
    allianceRankings: "Alliance Rankings",
    logout: "Logout",
    
    // Authentication
    registration: "Registration",
    username: "Username",
    email: "Email",
    password: "Password",
    registerButton: "Register",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Log in",
    login: "Login",
    usernameOrEmail: "Username or Email",
    loginButton: "Log in",
    noAccount: "Don't have an account?",
    registerLink: "Register",
    
    // Game connection
    gameConnection: "Game Connection",
    gameId: "Player ID",
    gameNick: "Game Nickname",
    connectGame: "Connect",
    
    // Profile
    profile: "Profile",
    editProfile: "Edit Profile",
    gameStats: "Game Statistics",
    characterName: "Character Name",
    server: "Server",
    alliance: "Alliance",
    level: "Level",
    currentPower: "Current Power",
    maxPower: "Historical Power",
    hiddenPower: "Hidden Power",
    editAlliance: "Edit Alliance",
    newAlliance: "New Alliance",
    cancel: "Cancel",
    save: "Save",
    
    // Rankings
    playerRankings: "Player Rankings",
    all: "All",
    sortBy: "Sort by",
    order: "Order",
    descending: "Descending",
    ascending: "Ascending",
    rank: "Rank",
    name: "Name",
    totalResults: "Total players: {count}",
    
    // Alliance rankings
    totalPower: "Total Power",
    memberCount: "Members",
    averagePower: "Average Power",
    totalAllianceResults: "Total alliances: {count}",
    
    // Footer
    copyright: "© 2023 GameStats Hub. All rights reserved.",
    
    // Notifications
    profileUpdated: "Profile updated",
    allianceUpdated: "Alliance updated",
    gameDataFetched: "Game data fetched",
    updateGameData: "Update Data"
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  // Initialize language from localStorage if available
  useState(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  });

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language][key] || key;
    
    if (params) {
      return Object.entries(params).reduce(
        (str, [key, value]) => str.replace(`{${key}}`, String(value)),
        translation
      );
    }
    
    return translation;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
