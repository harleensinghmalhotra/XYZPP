import { useTranslation } from 'react-i18next'

export default function CSR() {
  const { t } = useTranslation('csr')

  return (
    <section className="relative bg-[#fdfaf4] py-24">
      <div className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-14">
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-[var(--gold)] uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="mb-8 text-4xl font-bold tracking-tight text-[var(--navy)] sm:text-5xl">
            {t('title')}
          </h1>
          <p className="text-lg leading-relaxed text-[var(--ink)]">
            {t('coming')}
          </p>
        </div>
      </div>
    </section>
  )
}
