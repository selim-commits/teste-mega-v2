import styles from './LegalPage.module.css';

const SECTIONS = [
  { id: 'objet', title: 'Objet' },
  { id: 'acces', title: 'Acces au service' },
  { id: 'compte', title: 'Compte utilisateur' },
  { id: 'abonnement', title: 'Abonnement et tarifs' },
  { id: 'utilisation', title: 'Conditions d\'utilisation' },
  { id: 'propriete', title: 'Propriete intellectuelle' },
  { id: 'responsabilite', title: 'Responsabilite' },
  { id: 'resiliation', title: 'Resiliation' },
  { id: 'droit', title: 'Droit applicable' },
];

export function Terms() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalHero}>
        <p className={styles.legalEyebrow}>Legal</p>
        <h1 className={styles.legalTitle}>Conditions generales d'utilisation</h1>
        <p className={styles.legalDate}>Derniere mise a jour : 1er janvier 2026</p>
      </div>

      <nav className={styles.toc}>
        <span className={styles.tocTitle}>Sommaire</span>
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} className={styles.tocLink}>{s.title}</a>
        ))}
      </nav>

      <div className={styles.legalContent}>
        <section id="objet" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>1. Objet</h2>
          <p className={styles.sectionText}>
            Les presentes conditions generales d'utilisation (CGU) regissent l'acces et l'utilisation de la plateforme Rooom, un service de gestion en ligne destine aux studios de photographie et de videographie.
          </p>
        </section>

        <section id="acces" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>2. Acces au service</h2>
          <p className={styles.sectionText}>
            Le service est accessible via internet depuis un navigateur web compatible. Rooom s'efforce d'assurer une disponibilite continue du service mais ne peut garantir l'absence d'interruptions pour maintenance ou mises a jour.
          </p>
        </section>

        <section id="compte" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>3. Compte utilisateur</h2>
          <p className={styles.sectionText}>
            L'utilisation du service necessite la creation d'un compte. L'utilisateur est responsable de la confidentialite de ses identifiants et de toute activite realisee sous son compte.
          </p>
          <ul className={styles.sectionList}>
            <li>Un compte par studio ou professionnel</li>
            <li>Informations de compte exactes et a jour</li>
            <li>Notification immediate en cas d'utilisation non autorisee</li>
          </ul>
        </section>

        <section id="abonnement" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>4. Abonnement et tarifs</h2>
          <p className={styles.sectionText}>
            Rooom propose plusieurs formules d'abonnement dont les tarifs sont disponibles sur la page Tarifs. Les abonnements sont factures mensuellement ou annuellement selon le choix de l'utilisateur.
          </p>
          <ul className={styles.sectionList}>
            <li>Essai gratuit de 14 jours sans engagement</li>
            <li>Paiement par carte bancaire securise</li>
            <li>Possibilite de changer de formule a tout moment</li>
            <li>Facturation au prorata en cas de changement en cours de periode</li>
          </ul>
        </section>

        <section id="utilisation" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>5. Conditions d'utilisation</h2>
          <p className={styles.sectionText}>
            L'utilisateur s'engage a utiliser le service conformement a sa destination et aux lois en vigueur. Sont notamment interdits :
          </p>
          <ul className={styles.sectionList}>
            <li>Toute utilisation frauduleuse ou abusive du service</li>
            <li>La tentative d'acces non autorise aux systemes</li>
            <li>L'utilisation de robots ou scripts automatises</li>
            <li>La revente ou sous-licence du service sans autorisation</li>
          </ul>
        </section>

        <section id="propriete" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>6. Propriete intellectuelle</h2>
          <p className={styles.sectionText}>
            La plateforme Rooom, son design, son code source et ses contenus sont proteges par le droit de la propriete intellectuelle. L'utilisateur conserve l'entiere propriete des donnees qu'il saisit dans la plateforme.
          </p>
        </section>

        <section id="responsabilite" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>7. Responsabilite</h2>
          <p className={styles.sectionText}>
            Rooom s'engage a fournir un service fiable et securise. Cependant, la responsabilite de Rooom est limitee aux dommages directs et previsibles lies a l'utilisation du service, dans la limite du montant de l'abonnement annuel.
          </p>
        </section>

        <section id="resiliation" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>8. Resiliation</h2>
          <p className={styles.sectionText}>
            L'utilisateur peut resilier son abonnement a tout moment depuis les parametres de son compte. La resiliation prend effet a la fin de la periode de facturation en cours. Les donnees sont conservees pendant 30 jours apres la resiliation, puis supprimees definitivement.
          </p>
        </section>

        <section id="droit" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>9. Droit applicable</h2>
          <p className={styles.sectionText}>
            Les presentes CGU sont regies par le droit francais. En cas de litige, les parties s'engagent a rechercher une solution amiable avant toute action judiciaire. A defaut, les tribunaux de Paris seront competents.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Terms;
