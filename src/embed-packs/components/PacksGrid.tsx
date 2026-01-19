// src/embed-packs/components/PacksGrid.tsx
import { usePacksStore } from '../store/packsStore';
import { PackCard } from './PackCard';
import { SubscriptionCard } from './SubscriptionCard';
import { GiftCertificate } from './GiftCertificate';

export function PacksGrid() {
  const {
    currentTab,
    packs,
    subscriptions,
    giftCertificates,
    studio,
    selectPack,
    selectSubscription,
    selectGiftAmount,
  } = usePacksStore();

  const currency = studio?.currency || 'EUR';

  // Sort packs: featured first, then by hours
  const sortedPacks = [...packs].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
    return a.hours - b.hours;
  });

  // Sort subscriptions: featured first, then by billing cycle
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    return a.billing_cycle === 'monthly' ? -1 : 1;
  });

  if (currentTab === 'packs') {
    return (
      <div className="rooom-packs-animate-fade-in">
        <div className="rooom-packs-mb-6">
          <h2 className="rooom-packs-heading-2">Packs d'heures</h2>
          <p className="rooom-packs-text-secondary">
            Achetez des heures a l'avance et beneficiez de tarifs preferentiels
          </p>
        </div>
        <div className="rooom-packs-grid">
          {sortedPacks.map((pack) => (
            <PackCard key={pack.id} pack={pack} onSelect={selectPack} currency={currency} />
          ))}
        </div>
      </div>
    );
  }

  if (currentTab === 'subscriptions') {
    return (
      <div className="rooom-packs-animate-fade-in">
        <div className="rooom-packs-mb-6">
          <h2 className="rooom-packs-heading-2">Abonnements</h2>
          <p className="rooom-packs-text-secondary">
            Un forfait mensuel pour une utilisation reguliere de nos espaces
          </p>
        </div>
        <div className="rooom-packs-grid">
          {sortedSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onSelect={selectSubscription}
              currency={currency}
            />
          ))}
        </div>
      </div>
    );
  }

  if (currentTab === 'gifts') {
    return (
      <div className="rooom-packs-animate-fade-in">
        <div className="rooom-packs-mb-6">
          <h2 className="rooom-packs-heading-2">Cartes cadeaux</h2>
          <p className="rooom-packs-text-secondary">
            Offrez du temps de studio a vos proches ou collaborateurs
          </p>
        </div>
        <GiftCertificate
          certificates={giftCertificates}
          onSelect={selectGiftAmount}
          currency={currency}
        />
      </div>
    );
  }

  return null;
}
