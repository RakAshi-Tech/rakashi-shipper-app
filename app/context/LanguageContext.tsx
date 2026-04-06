'use client'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

type Lang = 'en' | 'hi'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    appName: 'RakAshi Shipper',
    appSubtitle: 'Delivery Request Platform',
    enterPhone: 'Enter your phone number',
    sendOtp: 'Send OTP',
    enterOtp: 'Enter OTP (Test: 123456)',
    verify: 'Verify',
    register: 'Register',
    registerTitle: 'First time? Enter your details',
    yourName: 'Your Name *',
    companyName: 'Company Name',
    registerStart: 'Register & Start',
    checking: 'Checking...',
    registering: 'Registering...',
    nearbyDrivers: 'Nearby Drivers',
    requestDelivery: '+ New Delivery Request',
    noDrivers: 'No drivers available nearby',
    requestBtn: 'Request →',
    km: 'km',
    score: 'Score',
    createRequest: 'Create Delivery Request',
    manualInput: 'Manual',
    ocrTab: 'Scan Bill',
    whatsappTab: 'WhatsApp',
    pickupAddress: 'Pickup Address',
    deliveryAddress: 'Delivery Address',
    itemDescription: 'Item Description',
    quantity: 'Quantity',
    weight: 'Weight (kg)',
    specialInstructions: 'Special Instructions',
    proposedFare: 'Proposed Fare (₹)',
    submitRequest: 'Send Request',
    submitting: 'Sending...',
    pickupPlaceholder: 'e.g. Mumbai Central Station',
    deliveryPlaceholder: 'e.g. Andheri East, Plot 42',
    itemPlaceholder: 'e.g. Electronic parts',
    instructionsPlaceholder: 'e.g. Handle with care',
    whatsappPaste: 'Paste WhatsApp message here',
    whatsappParse: 'Auto-fill from message',
    scanBill: 'Scan Bill / Invoice',
    takingPhoto: 'Take Photo',
    processing: 'Processing...',
    requestStatus: 'Request Status',
    waitingApproval: 'Waiting for approval',
    accepted: 'Accepted!',
    autoCancel: 'Auto-cancel in',
    seconds: 'seconds',
    cancelRequest: 'Cancel Request',
    sentTo: 'Request sent to',
    pickupLabel: 'Pickup',
    deliveryLabel: 'Delivery',
    itemLabel: 'Items',
    fareLabel: 'Fare',
    history: 'Delivery History',
    noHistory: 'No delivery history yet',
    status_pending: 'Pending',
    status_accepted: 'Accepted',
    status_picked_up: 'Picked Up',
    status_delivered: 'Delivered',
    status_cancelled: 'Cancelled',
    home: 'Home',
    request: 'Request',
    historyNav: 'History',
    profile: 'Profile',
    profileTitle: 'Profile',
    totalRequests: 'Total Requests',
    completedRequests: 'Completed',
    logout: 'Logout',
    leader: 'Leader',
    subLeader: 'Sub-Leader',
    standard: 'Standard',
    newRank: 'New',
    loading: 'Loading...',
    error: 'Error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    save: 'Save',
    selectedDriver: 'Selected Driver',
    anyDriver: 'Any available driver',
  },
  hi: {
    appName: 'RakAshi Shipper',
    appSubtitle: 'डिलीवरी अनुरोध प्लेटफॉर्म',
    enterPhone: 'अपना फ़ोन नंबर दर्ज करें',
    sendOtp: 'OTP भेजें',
    enterOtp: 'OTP दर्ज करें (टेस्ट: 123456)',
    verify: 'सत्यापित करें',
    register: 'पंजीकरण',
    registerTitle: 'पहली बार? अपनी जानकारी दर्ज करें',
    yourName: 'आपका नाम *',
    companyName: 'कंपनी का नाम',
    registerStart: 'पंजीकरण करें और शुरू करें',
    checking: 'जाँच हो रही है...',
    registering: 'पंजीकरण हो रहा है...',
    nearbyDrivers: 'पास के ड्राइवर',
    requestDelivery: '+ नई डिलीवरी अनुरोध',
    noDrivers: 'पास में कोई ड्राइवर उपलब्ध नहीं',
    requestBtn: 'अनुरोध करें →',
    km: 'किमी',
    score: 'स्कोर',
    createRequest: 'डिलीवरी अनुरोध बनाएं',
    manualInput: 'मैनुअल',
    ocrTab: 'बिल स्कैन',
    whatsappTab: 'WhatsApp',
    pickupAddress: 'पिकअप पता',
    deliveryAddress: 'डिलीवरी पता',
    itemDescription: 'सामान का विवरण',
    quantity: 'मात्रा',
    weight: 'वजन (किग्रा)',
    specialInstructions: 'विशेष निर्देश',
    proposedFare: 'प्रस्तावित किराया (₹)',
    submitRequest: 'अनुरोध भेजें',
    submitting: 'भेजा जा रहा है...',
    pickupPlaceholder: 'जैसे: मुंबई सेंट्रल स्टेशन',
    deliveryPlaceholder: 'जैसे: अंधेरी ईस्ट, प्लॉट 42',
    itemPlaceholder: 'जैसे: इलेक्ट्रॉनिक पार्ट्स',
    instructionsPlaceholder: 'जैसे: सावधानी से संभालें',
    whatsappPaste: 'यहाँ WhatsApp संदेश पेस्ट करें',
    whatsappParse: 'संदेश से स्वतः भरें',
    scanBill: 'बिल / चालान स्कैन करें',
    takingPhoto: 'फ़ोटो लें',
    processing: 'प्रसंस्करण हो रहा है...',
    requestStatus: 'अनुरोध स्थिति',
    waitingApproval: 'स्वीकृति का इंतज़ार',
    accepted: 'स्वीकार किया गया!',
    autoCancel: 'स्वतः रद्द',
    seconds: 'सेकंड में',
    cancelRequest: 'अनुरोध रद्द करें',
    sentTo: 'अनुरोध भेजा गया',
    pickupLabel: 'पिकअप',
    deliveryLabel: 'डिलीवरी',
    itemLabel: 'सामान',
    fareLabel: 'किराया',
    history: 'डिलीवरी इतिहास',
    noHistory: 'अभी तक कोई डिलीवरी इतिहास नहीं',
    status_pending: 'लंबित',
    status_accepted: 'स्वीकृत',
    status_picked_up: 'उठाया गया',
    status_delivered: 'डिलीवर किया गया',
    status_cancelled: 'रद्द किया गया',
    home: 'होम',
    request: 'अनुरोध',
    historyNav: 'इतिहास',
    profile: 'प्रोफ़ाइल',
    profileTitle: 'प्रोफ़ाइल',
    totalRequests: 'कुल अनुरोध',
    completedRequests: 'पूर्ण',
    logout: 'लॉग आउट',
    leader: 'लीडर',
    subLeader: 'उप-नेता',
    standard: 'मानक',
    newRank: 'नया',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि हुई',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    back: 'वापस',
    save: 'सहेजें',
    selectedDriver: 'चयनित ड्राइवर',
    anyDriver: 'कोई भी उपलब्ध ड्राइवर',
  },
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('shipperLang') as Lang
    if (saved === 'hi' || saved === 'en') setLangState(saved)
  }, [])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('shipperLang', newLang)
  }

  const t = (key: string): string => {
    return translations[lang][key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
