"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Operator = "+" | "−" | "×" | "÷";

const calculate = (left: number, right: number, operator: Operator) => {
  let result: number;

  switch (operator) {
    case "+":
      result = left + right;
      break;
    case "−":
      result = left - right;
      break;
    case "×":
      result = left * right;
      break;
    case "÷":
      if (right === 0) return null;
      result = left / right;
      break;
  }

  return Number.isFinite(result) ? Number(result.toPrecision(12)) : null;
};

const formatResult = (value: number) => (Object.is(value, -0) ? "0" : String(value));

const operatorLabels: Record<Operator, string> = {
  "+": "+",
  "−": "−",
  "×": "×",
  "÷": "÷",
};

export default function Home() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const resetAll = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setStoredValue(null);
    setPendingOperator(null);
    setShouldResetDisplay(false);
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      if (display === "Error") resetAll();

      setDisplay((current) => {
        const startingNewNumber = shouldResetDisplay || current === "Error";
        const next = startingNewNumber ? (digit === "." ? "0." : digit) : current;

        if (!startingNewNumber && digit === "." && next.includes(".")) return next;
        if (!startingNewNumber && next.replace(".", "").length >= 14) return next;
        return startingNewNumber ? next : next === "0" && digit !== "." ? digit : `${next}${digit}`;
      });

      if (shouldResetDisplay || display === "Error") setExpression("");
      setShouldResetDisplay(false);
    },
    [display, resetAll, shouldResetDisplay],
  );

  const selectOperator = useCallback(
    (operator: Operator) => {
      if (display === "Error") return;
      const currentValue = Number(display);

      if (storedValue !== null && pendingOperator && !shouldResetDisplay) {
        const result = calculate(storedValue, currentValue, pendingOperator);
        if (result === null) {
          setDisplay("Error");
          setExpression("");
          setStoredValue(null);
          setPendingOperator(null);
          setShouldResetDisplay(true);
          return;
        }
        setDisplay(formatResult(result));
        setStoredValue(result);
        setExpression(`${formatResult(result)} ${operatorLabels[operator]}`);
      } else {
        setStoredValue(currentValue);
        setExpression(`${display} ${operatorLabels[operator]}`);
      }

      setPendingOperator(operator);
      setShouldResetDisplay(true);
    },
    [display, pendingOperator, shouldResetDisplay, storedValue],
  );

  const calculateResult = useCallback(() => {
    if (display === "Error" || storedValue === null || pendingOperator === null) return;

    const currentValue = Number(display);
    const result = calculate(storedValue, currentValue, pendingOperator);

    if (result === null) {
      setDisplay("Error");
      setExpression("Cannot divide by zero");
    } else {
      setDisplay(formatResult(result));
      setExpression(
        `${formatResult(storedValue)} ${operatorLabels[pendingOperator]} ${display} =`,
      );
    }

    setStoredValue(null);
    setPendingOperator(null);
    setShouldResetDisplay(true);
  }, [display, pendingOperator, storedValue]);

  const changeSign = useCallback(() => {
    if (display === "Error" || Number(display) === 0) return;
    setDisplay(formatResult(Number(display) * -1));
    setShouldResetDisplay(false);
  }, [display]);

  const inputPercent = useCallback(() => {
    if (display === "Error") return;
    setDisplay(formatResult(Number(display) / 100));
    setShouldResetDisplay(false);
  }, [display]);

  const backspace = useCallback(() => {
    if (display === "Error") {
      resetAll();
      return;
    }
    if (shouldResetDisplay) return;
    setDisplay((current) => {
      const next = current.length > 1 ? current.slice(0, -1) : "0";
      return next === "-" ? "0" : next;
    });
  }, [display, resetAll, shouldResetDisplay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9.]$/.test(event.key)) {
        event.preventDefault();
        inputDigit(event.key);
      } else if (event.key === "+" || event.key === "-") {
        event.preventDefault();
        selectOperator(event.key === "+" ? "+" : "−");
      } else if (event.key === "*" || event.key === "/") {
        event.preventDefault();
        selectOperator(event.key === "*" ? "×" : "÷");
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculateResult();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key === "Escape" || event.key === "Delete") {
        event.preventDefault();
        resetAll();
      } else if (event.key === "%") {
        event.preventDefault();
        inputPercent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    backspace,
    calculateResult,
    inputDigit,
    inputPercent,
    resetAll,
    selectOperator,
  ]);

  const keys = [
    { label: "AC", action: resetAll, variant: "utility", ariaLabel: "Clear all" },
    { label: "±", action: changeSign, variant: "utility", ariaLabel: "Toggle sign" },
    { label: "%", action: inputPercent, variant: "utility", ariaLabel: "Percent" },
    { label: "÷", action: () => selectOperator("÷"), variant: "operator", ariaLabel: "Divide" },
    { label: "7", action: () => inputDigit("7"), variant: "number" },
    { label: "8", action: () => inputDigit("8"), variant: "number" },
    { label: "9", action: () => inputDigit("9"), variant: "number" },
    { label: "×", action: () => selectOperator("×"), variant: "operator", ariaLabel: "Multiply" },
    { label: "4", action: () => inputDigit("4"), variant: "number" },
    { label: "5", action: () => inputDigit("5"), variant: "number" },
    { label: "6", action: () => inputDigit("6"), variant: "number" },
    { label: "−", action: () => selectOperator("−"), variant: "operator", ariaLabel: "Subtract" },
    { label: "1", action: () => inputDigit("1"), variant: "number" },
    { label: "2", action: () => inputDigit("2"), variant: "number" },
    { label: "3", action: () => inputDigit("3"), variant: "number" },
    { label: "+", action: () => selectOperator("+"), variant: "operator", ariaLabel: "Add" },
    { label: "0", action: () => inputDigit("0"), variant: "number zero" },
    { label: ".", action: () => inputDigit("."), variant: "number" },
    { label: "=", action: calculateResult, variant: "equals", ariaLabel: "Equals" },
  ];

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Sum home">
          <span className="brand-mark" aria-hidden="true">s</span>
          <span>sum<span className="brand-period">.</span></span>
        </Link>
        <span className="topbar-note"><span className="status-dot" /> A little clarity, anytime</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow"><span className="eyebrow-line" /> YOUR EVERYDAY CALCULATOR</p>
          <h1 id="page-title">Numbers,<br />made <span>simple.</span></h1>
          <p className="intro-copy">
            From quick sums to the little calculations that keep your day moving. Just type, tap, and get on with it.
          </p>
          <div className="keyboard-hint">
            <span className="keyboard-icon" aria-hidden="true">⌨</span>
            <span>Works with your keyboard, too</span>
          </div>
          <div className="decorative-orbit orbit-one" aria-hidden="true" />
          <div className="decorative-orbit orbit-two" aria-hidden="true" />
        </div>

        <section className="calculator" aria-label="Calculator">
          <div className="calculator-top">
            <div className="calculator-title">
              <span className="calculator-icon" aria-hidden="true"><span>+</span><span>−</span></span>
              <div>
                <p className="calculator-name">Quick calc</p>
                <p className="calculator-subtitle">A clear answer, right away</p>
              </div>
            </div>
            <span className="calculator-menu" aria-hidden="true">•••</span>
          </div>

          <div className="display" aria-live="polite" aria-atomic="true">
            <p className={`expression${expression === "Cannot divide by zero" ? " error-message" : ""}`}>
              {expression || "\u00a0"}
            </p>
            <p className={`result${display.length > 11 ? " result-small" : ""}`}>{display}</p>
          </div>

          <div className="keypad" aria-label="Calculator keys">
            {keys.map((key) => (
              <button
                className={`key key-${key.variant}`}
                key={key.label}
                type="button"
                onClick={key.action}
                aria-label={key.ariaLabel ?? key.label}
              >
                {key.label}
              </button>
            ))}
          </div>

          <p className="calculator-footer"><span className="sparkle" aria-hidden="true">✳</span> Simple math. No fuss.</p>
        </section>
      </section>

      <footer className="page-footer">
        <span>MADE FOR THE EVERYDAY</span>
        <span>Take it one number at a time <span aria-hidden="true">↗</span></span>
      </footer>
    </main>
  );
}
