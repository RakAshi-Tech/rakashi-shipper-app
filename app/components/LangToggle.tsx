'use client'
import { useLang } from '../context/LanguageContext'

export const LangToggle = () => {
  const { lang, setLang } = useLang()
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: lang === l ? 'bold' : 'normal',
            backgroundColor: lang === l ? '#f97316' : '#374151',
            color: '#ffffff',
          }}
        >
          {l === 'en' ? 'EN' : 'हिंदी'}
        </button>
      ))}
    </div>
  )
}
