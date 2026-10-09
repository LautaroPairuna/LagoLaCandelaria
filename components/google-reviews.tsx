import { googleRating, googleReviews, type GoogleReview } from "@/lib/google-reviews"
import { mapUrl } from "@/lib/site"

function StarGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path
        fill="currentColor"
        d="M10 1.4 12.5 7l6.1.6-4.6 4 1.4 6-5.4-3.2L4.6 17.6 6 11.6 1.4 7.6 7.5 7 10 1.4Z"
      />
    </svg>
  )
}

function Stars({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <span className={className ? `stars ${className}` : "stars"} role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => {
        const amount = Math.min(1, Math.max(0, value - index))
        return (
          <span key={index} className="star">
            <StarGlyph />
            <span className="star-fill" style={{ width: `${amount * 100}%` }}>
              <StarGlyph />
            </span>
          </span>
        )
      })}
    </span>
  )
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <article className="review-card">
      <header>
        <p>{review.name}</p>
        <p className="review-when">{review.when}</p>
      </header>
      <Stars className="stars-review" value={review.rating} label={`${review.rating} de 5 estrellas`} />
      <p>{review.text}</p>
    </article>
  )
}

function ReviewLoop() {
  return (
    <div className="review-loop">
      {googleReviews.map((review) => (
        <div key={review.name} className="review-slot">
          <ReviewCard review={review} />
        </div>
      ))}
    </div>
  )
}

export function GoogleReviews() {
  const score = googleRating.score.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const count = googleRating.count.toLocaleString("es-AR")

  return (
    <aside className="google-score" aria-labelledby="puntuacion-titulo">
      <a className="google-score-head" href={mapUrl} target="_blank" rel="noreferrer">
        <span className="google-score-row">
          <strong>{score}</strong>
          <Stars className="stars-score" value={googleRating.score} label={`${score} de 5`} />
        </span>
        <span className="google-score-count">{count} opiniones</span>
        <span className="sr-only">en Google</span>
      </a>
      <div className="review-marquee">
        <div className="review-track">
          <ReviewLoop />
          <div aria-hidden>
            <ReviewLoop />
          </div>
        </div>
      </div>
    </aside>
  )
}
