'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '../components/BottomNav'
import { LangToggle } from '../components/LangToggle'
import { useLang } from '../context/LanguageContext'

type TabType = 'manual' | 'ocr' | 'whatsapp'

export default function RequestPage() {
  const router = useRouter()
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [pickupAddress, setPickupAddress] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemWeight, setItemWeight] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [proposedFare, setProposedFare] = useState('')
  const [loading, setLoading] = useState(false)
  const [whatsappText, setWhatsappText] = useState('')
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedDriverName, setSelectedDriverName] = useState<string | null>(null)

  useEffect(() => {
    const shipperId = localStorage.getItem('shipperId')
    if (!shipperId) {
      router.replace('/')
      return
    }
    setSelectedDriverName(localStorage.getItem('selectedDriverName'))
  }, [router])

  const parseWhatsAppText = (text: string) => {
    const lines = text.split('\n')
    lines.forEach((line) => {
      const lower = line.toLowerCase()
      if (
        lower.includes('pickup') ||
        lower.includes('集荷') ||
        lower.includes('from')
      ) {
        setPickupAddress(line.split(':').slice(1).join(':').trim())
      }
      if (
        lower.includes('delivery') ||
        lower.includes('配送') ||
        lower.includes('to')
      ) {
        setDeliveryAddress(line.split(':').slice(1).join(':').trim())
      }
      if (
        lower.includes('item') ||
        lower.includes('荷物') ||
        lower.includes('goods')
      ) {
        setItemDescription(line.split(':').slice(1).join(':').trim())
      }
      if (lower.includes('fare') || lower.includes('料金') || lower.includes('₹')) {
        const match = line.match(/\d+/)
        if (match) setProposedFare(match[0])
      }
    })
    setActiveTab('manual')
  }

  const handleOcrCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCapturedImage(url)
    setOcrProcessing(true)
    // Simulate OCR processing
    setTimeout(() => {
      setOcrProcessing(false)
      setItemDescription('Scanned item (please edit)')
      setActiveTab('manual')
    }, 2000)
  }

  const sendRequestToDrivers = async (requestId: string) => {
    const selectedDriverId = localStorage.getItem('selectedDriverId')
    try {
      if (selectedDriverId) {
        await supabase.from('request_notifications').insert({
          request_id: requestId,
          driver_id: selectedDriverId,
          status: 'sent',
        })
      } else {
        const { data: topDrivers } = await supabase
          .from('driver_profiles')
          .select('id')
          .eq('is_active', true)
          .order('trust_score', { ascending: false })
          .limit(3)

        if (topDrivers) {
          for (const d of topDrivers) {
            await supabase.from('request_notifications').insert({
              request_id: requestId,
              driver_id: d.id,
              status: 'sent',
            })
          }
        }
      }
    } catch (err) {
      console.error('Notification error:', err)
    }
  }

  const handleSubmit = async () => {
    if (!pickupAddress || !deliveryAddress || !itemDescription) return
    setLoading(true)
    try {
      const shipperId = localStorage.getItem('shipperId')
      const selectedDriverId = localStorage.getItem('selectedDriverId')

      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          shipper_id: shipperId,
          driver_id: selectedDriverId || null,
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
          item_description: itemDescription,
          item_quantity: itemQuantity,
          item_weight_kg: itemWeight ? parseFloat(itemWeight) : null,
          special_instructions: specialInstructions || null,
          proposed_fare_inr: proposedFare ? parseFloat(proposedFare) : null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        await sendRequestToDrivers(data.id)
        router.push(`/status/${data.id}`)
      }
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#0f0f1a',
    border: '1px solid #374151',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#9ca3af',
    fontSize: '12px',
    marginBottom: '6px',
  }

  const fieldStyle: React.CSSProperties = { marginBottom: '14px' }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 4px',
    background: active ? '#f97316' : 'transparent',
    border: 'none',
    borderBottom: active ? 'none' : '2px solid #374151',
    color: active ? '#ffffff' : '#9ca3af',
    fontSize: '13px',
    fontWeight: active ? 'bold' : 'normal',
    cursor: 'pointer',
  })

  const isFormValid = pickupAddress && deliveryAddress && itemDescription

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#12122a',
          padding: '12px 16px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #374151',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ←
          </button>
          <span
            style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}
          >
            {t('createRequest')}
          </span>
        </div>
        <LangToggle />
      </div>

      {/* Selected driver badge */}
      {selectedDriverName && (
        <div
          style={{
            margin: '12px 16px 0',
            padding: '10px 14px',
            background: '#f9731622',
            border: '1px solid #f97316',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>🚗</span>
          <div>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>
              {t('selectedDriver')}
            </span>
            <div style={{ color: '#f97316', fontSize: '14px', fontWeight: 'bold' }}>
              {selectedDriverName}
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('selectedDriverId')
              localStorage.removeItem('selectedDriverName')
              setSelectedDriverName(null)
            }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          margin: '12px 16px 0',
          background: '#1a1a2e',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <button style={tabStyle(activeTab === 'manual')} onClick={() => setActiveTab('manual')}>
          📝 {t('manualInput')}
        </button>
        <button style={tabStyle(activeTab === 'ocr')} onClick={() => setActiveTab('ocr')}>
          📷 {t('ocrTab')}
        </button>
        <button style={tabStyle(activeTab === 'whatsapp')} onClick={() => setActiveTab('whatsapp')}>
          💬 {t('whatsappTab')}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('pickupAddress')} *</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder={t('pickupPlaceholder')}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('deliveryAddress')} *</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={t('deliveryPlaceholder')}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('itemDescription')} *</label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder={t('itemPlaceholder')}
                style={inputStyle}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              <div>
                <label style={labelStyle}>{t('quantity')}</label>
                <input
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('weight')}</label>
                <input
                  type="number"
                  value={itemWeight}
                  onChange={(e) => setItemWeight(e.target.value)}
                  placeholder="5.0"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('proposedFare')}</label>
              <input
                type="number"
                value={proposedFare}
                onChange={(e) => setProposedFare(e.target.value)}
                placeholder="500"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('specialInstructions')}</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={t('instructionsPlaceholder')}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              style={{
                width: '100%',
                padding: '16px',
                background: loading || !isFormValid ? '#374151' : '#f97316',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                marginTop: '8px',
              }}
            >
              {loading ? t('submitting') : t('submitRequest')}
            </button>
          </>
        )}

        {/* OCR Tab */}
        {activeTab === 'ocr' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                background: '#1a1a2e',
                borderRadius: '16px',
                padding: '32px 24px',
                border: '2px dashed #374151',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
                {t('scanBill')}
              </p>
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                />
              )}
              {ocrProcessing ? (
                <div style={{ color: '#f97316', fontSize: '14px' }}>
                  ⏳ {t('processing')}
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleOcrCapture}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '14px 28px',
                      background: '#f97316',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    📷 {t('takingPhoto')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              {t('whatsappPaste')}
            </p>
            <textarea
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              placeholder={`Pickup: Mumbai Central\nDelivery: Andheri East\nItem: Electronics\nFare: ₹500`}
              rows={8}
              style={{
                width: '100%',
                padding: '14px',
                background: '#0f0f1a',
                border: '1px solid #374151',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                marginBottom: '16px',
              }}
            />
            <button
              onClick={() => parseWhatsAppText(whatsappText)}
              disabled={!whatsappText.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: !whatsappText.trim() ? '#374151' : '#25D366',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: !whatsappText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              💬 {t('whatsappParse')}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
