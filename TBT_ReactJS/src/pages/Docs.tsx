import pdf from "@/assets/KTMG_Employee_Instructions_SMS_Support_Ticketing_TBT.pdf"

export default function Docs() {
  return (
    <div style={{ position: 'fixed', inset: 0, margin: 0, padding: 0, background: '#fff' }}>
      <iframe
        title="Documentation PDF"
        src={pdf}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, display: 'block' }}
      />
    </div>
  )
}
