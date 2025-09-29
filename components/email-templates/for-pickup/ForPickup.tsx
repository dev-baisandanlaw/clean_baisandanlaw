import { ForPickupProps } from "../index";
import styles from "../emailStyles.module.css";

export function ForPickup({ fullname, referenceNumber }: ForPickupProps) {
  return (
    <div className={styles.email_container}>
      {/* <img
        src="/images/logo.png"
        alt="Baisandan Law"
        width={100}
        height={100}
        style={{ display: "block", margin: "0 auto" }}
      />

      <hr /> */}

      <h2 className={styles.primary_text}>
        Your Notary Request is Ready for Pickup!
      </h2>

      <div className={styles.content_container}>
        <p className={styles.generic_p}>
          Good day, <strong>{fullname}</strong>!
        </p>

        <p className={styles.generic_p}>
          We are glad to inform you that your notary request is ready for
          pickup. Please present the reference number below when claiming your
          document.
        </p>

        <p
          className={`${styles.generic_p} ${styles.bold} ${styles.center} ${styles.primary_text}`}
        >
          <strong>{referenceNumber}</strong>
        </p>

        <p
          className={`${styles.generic_p} ${styles.center} ${styles.primary_text}`}
        >
          Thank you for choosing Baisandan Law
        </p>
      </div>
    </div>
  );
}
