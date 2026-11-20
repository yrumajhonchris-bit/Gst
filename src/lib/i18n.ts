import { Language } from '../types/gha';

export const TRANSLATIONS: Record<
  Language,
  {
    home: string;
    wealth: string;
    team: string;
    task: string;
    mine: string;
    deposit: string;
    withdraw: string;
    invite: string;
    incomeWallet: string;
    personalWallet: string;
    ongoing: string;
    completed: string;
    details: string;
    submit: string;
    cashGift: string;
    surpriseCard: string;
    goldenEgg: string;
    aboutUs: string;
    news: string;
    employeeManual: string;
    membershipLevel: string;
    vipJourney: string;
    settings: string;
    address: string;
    financialRecords: string;
    transactionRecords: string;
    agreements: string;
    download: string;
    coupon: string;
    message: string;
    language: string;
    logOut: string;
    login: string;
    register: string;
    customerService: string;
  }
> = {
  en: {
    home: 'Home',
    wealth: 'Wealth',
    team: 'Team',
    task: 'Task',
    mine: 'Mine',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    invite: 'Invite',
    incomeWallet: 'Income Wallet',
    personalWallet: 'Personal Wallet',
    ongoing: 'Ongoing',
    completed: 'Completed',
    details: 'Details',
    submit: 'Submit',
    cashGift: 'Cash Gift',
    surpriseCard: 'Surprise Card',
    goldenEgg: 'Golden Egg Smash',
    aboutUs: 'About Us',
    news: 'News',
    employeeManual: 'Employee Manual',
    membershipLevel: 'Membership Level',
    vipJourney: 'VIP Journey',
    settings: 'Settings',
    address: 'Address',
    financialRecords: 'Financial Records',
    transactionRecords: 'Transaction Records',
    agreements: 'Agreements',
    download: 'Download',
    coupon: 'Coupon',
    message: 'Message',
    language: 'Language',
    logOut: 'Log Out',
    login: 'Login',
    register: 'Register',
    customerService: 'GST Online Service',
  },
  tl: {
    home: 'Tahanan',
    wealth: 'Puhunan',
    team: 'Koponan',
    task: 'Gawain',
    mine: 'Akin',
    deposit: 'Deposito',
    withdraw: 'Mag-withdraw',
    invite: 'Mag-imbita',
    incomeWallet: 'Pitaka ng Kita',
    personalWallet: 'Personal na Pitaka',
    ongoing: 'Kasalukuyan',
    completed: 'Tapos Na',
    details: 'Detalye',
    submit: 'Isumite',
    cashGift: 'Regalong Cash',
    surpriseCard: 'Surprise Card',
    goldenEgg: 'Basagin ang Gintong Itlog',
    aboutUs: 'Tungkol sa Amin',
    news: 'Balita',
    employeeManual: 'Manwal ng Empleyado',
    membershipLevel: 'Antas ng Miyembro',
    vipJourney: 'VIP Paglalakbay',
    settings: 'Mga Setting',
    address: 'Tirahan',
    financialRecords: 'Talaan ng Pinansyal',
    transactionRecords: 'Talaan ng Transaksyon',
    agreements: 'Mga Kasunduan',
    download: 'I-download',
    coupon: 'Kupon',
    message: 'Mensahe',
    language: 'Wika',
    logOut: 'Mag-log Out',
    login: 'Mag-login',
    register: 'Magrehistro',
    customerService: 'Suporta ng GST',
  },
};

export function t(lang: Language, key: keyof (typeof TRANSLATIONS)['en']): string {
  return TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key];
}
