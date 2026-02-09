import styles from './LegalPage.module.css';

const SECTIONS = [
  { id: 'collecte', title: 'Collecte des donnees' },
  { id: 'utilisation', title: 'Utilisation des donnees' },
  { id: 'partage', title: 'Partage des donnees' },
  { id: 'stockage', title: 'Stockage et securite' },
  { id: 'droits', title: 'Vos droits' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'modifications', title: 'Modifications' },
  { id: 'contact', title: 'Contact' },
];

export function Privacy() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalHero}>
        <p className={styles.legalEyebrow}>Legal</p>
        <h1 className={styles.legalTitle}>Politique de confidentialite</h1>
        <p className={styles.legalDate}>Derniere mise a jour : 1er janvier 2026</p>
      </div>

      <nav className={styles.toc}>
        <span className={styles.tocTitle}>Sommaire</span>
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} className={styles.tocLink}>{s.title}</a>
        ))}
      </nav>

      <div className={styles.legalContent}>
        <section id="collecte" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>1. Collecte des donnees</h2>
          <p className={styles.sectionText}>
            Rooom collecte les donnees necessaires au fonctionnement du service de gestion de studio. Ces donnees incluent :
          </p>
          <ul className={styles.sectionList}>
            <li>Informations de compte : nom, email, mot de passe (chiffre)</li>
            <li>Donnees de studio : nom du studio, adresse, horaires</li>
            <li>Donnees de reservation : dates, clients, montants</li>
            <li>Donnees techniques : adresse IP, type de navigateur, logs de connexion</li>
          </ul>
        </section>

        <section id="utilisation" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>2. Utilisation des donnees</h2>
          <p className={styles.sectionText}>
            Vos donnees sont utilisees exclusivement pour fournir et ameliorer le service Rooom :
          </p>
          <ul className={styles.sectionList}>
            <li>Gestion de votre compte et authentification</li>
            <li>Traitement des reservations et facturation</li>
            <li>Envoi de notifications relatives a votre activite</li>
            <li>Amelioration de la plateforme et analyses d'usage anonymisees</li>
          </ul>
        </section>

        <section id="partage" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>3. Partage des donnees</h2>
          <p className={styles.sectionText}>
            Rooom ne vend jamais vos donnees personnelles. Nous partageons des donnees uniquement avec :
          </p>
          <ul className={styles.sectionList}>
            <li>Supabase (hebergement et base de donnees)</li>
            <li>Prestataires de paiement pour le traitement des transactions</li>
            <li>Autorites competentes lorsque la loi l'exige</li>
          </ul>
        </section>

        <section id="stockage" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>4. Stockage et securite</h2>
          <p className={styles.sectionText}>
            Vos donnees sont hebergees au sein de l'Union europeenne. Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos donnees : chiffrement en transit (TLS) et au repos, controle d'acces strict, et surveillance continue.
          </p>
        </section>

        <section id="droits" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>5. Vos droits</h2>
          <p className={styles.sectionText}>
            Conformement au RGPD, vous disposez des droits suivants :
          </p>
          <ul className={styles.sectionList}>
            <li>Droit d'acces a vos donnees personnelles</li>
            <li>Droit de rectification des donnees inexactes</li>
            <li>Droit a l'effacement (droit a l'oubli)</li>
            <li>Droit a la portabilite de vos donnees</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit de retirer votre consentement a tout moment</li>
          </ul>
          <p className={styles.sectionText}>
            Pour exercer vos droits, contactez-nous a privacy@rooom.studio.
          </p>
        </section>

        <section id="cookies" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>6. Cookies</h2>
          <p className={styles.sectionText}>
            Rooom utilise des cookies strictement necessaires au fonctionnement du service (authentification, preferences). Aucun cookie publicitaire ou de tracking tiers n'est utilise.
          </p>
        </section>

        <section id="modifications" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>7. Modifications</h2>
          <p className={styles.sectionText}>
            Nous nous reservons le droit de modifier cette politique de confidentialite. Les utilisateurs seront informes par email de tout changement significatif au moins 30 jours avant son entree en vigueur.
          </p>
        </section>

        <section id="contact" className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>8. Contact</h2>
          <p className={styles.sectionText}>
            Pour toute question relative a la protection de vos donnees, contactez notre delegue a la protection des donnees :
          </p>
          <p className={styles.sectionText}>
            Email : privacy@rooom.studio
          </p>
        </section>
      </div>
    </div>
  );
}

export default Privacy;
