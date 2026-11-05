import { useEffect, useRef, useState } from 'react'

const symbols = ['🍎', '🍌', '🍇', '🍓']

function createCards() {
  const shuffled = [...symbols, ...symbols].sort(() => Math.random() - 0.5)
  return shuffled.map((symbol, id) => ({ id, symbol, flipped: false, matched: false }))
}

function MemoryGame() {
  const [cards, setCards] = useState(createCards);
  const [selected, setSelected] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleFlip = (index) => {
    if (locked || cards[index].flipped || cards[index].matched) return;

    const updatedCards = cards.map((card, cardIndex) => (
      cardIndex === index ? { ...card, flipped: true } : card
    ));
    setCards(updatedCards);

    if (selected.length === 0) {
      setSelected([index]);
      return;
    }

    const firstIndex = selected[0];
    setSelected([]);
    if (cards[firstIndex].symbol === cards[index].symbol) {
      setCards(updatedCards.map((card, cardIndex) => (
        cardIndex === firstIndex || cardIndex === index ? { ...card, matched: true } : card
      )));
      setMatchedPairs((count) => count + 1);
      return;
    }

    setLocked(true);
    timeoutRef.current = setTimeout(() => {
      setCards((currentCards) => currentCards.map((card, cardIndex) => (
        cardIndex === firstIndex || cardIndex === index ? { ...card, flipped: false } : card
      )));
      setLocked(false);
    }, 1000);
  };

  const resetGame = () => {
    clearTimeout(timeoutRef.current);
    setCards(createCards());
    setSelected([]);
    setMatchedPairs(0);
    setLocked(false);
  };

  const won = matchedPairs === symbols.length;

  return (
    <section className="memory-game">
      <div className="memory-game__top">
        <div>
          <span className="memory-game__eyebrow">A MOMENT TO PLAY</span>
          <h2>A little memory match</h2>
        </div>
        <p className="memory-game__score" aria-live="polite">
        {won ? 'Wonderful! You found every pair.' : `Pairs found: ${matchedPairs} of ${symbols.length}`}
        </p>
      </div>
      <div className="memory-game__grid">
        {cards.map((card, index) => {
          const visible = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-game__card${visible ? ' memory-game__card--visible' : ''}${card.matched ? ' memory-game__card--matched' : ''}`}
              onClick={() => handleFlip(index)}
              disabled={visible || locked || won}
              aria-label={visible ? `${card.symbol}${card.matched ? ', matched' : ''}` : `Reveal card ${index + 1}`}
            >
              <span aria-hidden="true">{visible ? card.symbol : '?'}</span>
            </button>
          );
        })}
      </div>
      <button className="app-button app-button--primary memory-game__reset" type="button" onClick={resetGame}>
        <span aria-hidden="true">↻</span> Start a new game
      </button>
    </section>
  );
}

export default MemoryGame;
