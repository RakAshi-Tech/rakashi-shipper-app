'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LangToggle } from './components/LangToggle'
import { useLang } from './context/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLang()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const shipperId = localStorage.getItem('shipperId')
    if (shipperId) router.replace('/home')
  }, [router])

  const handleSendOtp = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('shipper_profiles')
        .select('*')
        .eq('phone_number', `+91${phone}`)
        .single()

      if (data) {
        localStorage.setItem('shipperId', data.id)
        localStorage.setItem('shipperName', data.name)
        localStorage.setItem('shipperPhone', data.phone_number)
        setStep('otp')
      } else {
        setStep('register')
      }
    } catch {
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = () => {
    if (otp === '123456') {
      router.push('/home')
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shipper_profiles')
        .insert({
          phone_number: `+91${phone}`,
          name,
          company_name: company,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        localStorage.setItem('shipperId', data.id)
        localStorage.setItem('shipperName', data.name)
        localStorage.setItem('shipperPhone', data.phone_number)
        router.push('/home')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: '#0f0f1a',
    border: '1px solid #374151',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '16px',
    background: disabled ? '#374151' : '#f97316',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '8px',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Lang toggle */}
      <div style={{ position: 'fixed', top: '16px', right: '16px' }}>
        <LangToggle />
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚚</div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#f97316',
            margin: '0 0 8px',
          }}
        >
          {t('appName')}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
          {t('appSubtitle')}
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: '16px',
          padding: '32px 24px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {step === 'phone' && (
          <>
            <p
              style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}
            >
              {t('enterPhone')}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '14px',
                  background: '#0f0f1a',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '16px',
                  border: '1px solid #374151',
                  whiteSpace: 'nowrap',
                }}
              >
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
              style={btnStyle(loading || phone.length < 10)}
            >
              {loading ? t('checking') : t('sendOtp')}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p
              style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}
            >
              {t('enterOtp')}
            </p>
            <input
              type="number"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              style={{
                ...inputStyle,
                fontSize: '24px',
                textAlign: 'center',
                marginBottom: '20px',
                letterSpacing: '8px',
              }}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
              style={btnStyle(otp.length < 6)}
            >
              {t('verify')}
            </button>
          </>
        )}

        {step === 'register' && (
          <>
            <p
              style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}
            >
              {t('registerTitle')}
            </p>
            {[
              {
                label: t('yourName'),
                value: name,
                setter: setName,
                placeholder: 'Rahul Sharma',
              },
              {
                label: t('companyName'),
                value: company,
                setter: setCompany,
                placeholder: 'Apex Logistics Co.',
              },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#9ca3af',
                    fontSize: '12px',
                    marginBottom: '6px',
                  }}
                >
                  {f.label}
                </label>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
            <button
              onClick={handleRegister}
              disabled={loading || !name}
              style={btnStyle(loading || !name)}
            >
              {loading ? t('registering') : t('registerStart')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
