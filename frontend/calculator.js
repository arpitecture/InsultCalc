const screen = document.querySelector(".screen");
const buttons = document.querySelector(".buttons");
const busyNote = document.querySelector(".busy-note");


let previous = "";
let operator = "";
let current = "";
let justEvaluated = false;
const roastBox = document.querySelector(".roast");

async function getRoast(a, op, b) {
    try {
        const res = await fetch("/roast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ a, op, b }),
        });
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        busyNote.style.display = "none";
        
        return data.roast;
    } catch {
        busyNote.style.display = "block";
        return "I'd insult you, but I'm too tired. Even for this.";
    }
}

async function showRoast(a, op, b) {
    roastBox.textContent = "Sighing...";
    roastBox.textContent = await getRoast(a, op, b);
}

function compute(a, op, b) {
    a = Number(a);
    b = Number(b);
    let result;
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else if (op === "*") result = a * b;
    else if (op === "/") {
        if (b === 0) return "Error";
        result = a / b;
    }
    return parseFloat(result.toFixed(10));
}

function updateScreen() {
    screen.textContent = `${previous} ${operator} ${current}`.trim() || "0";
}

function reset() {
    previous = "";
    operator = "";
    current = "";
    justEvaluated = false;
}

buttons.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const value = btn.dataset.value;

    if (value === "C") {
        reset();
    }
    else if ("0123456789".includes(value)) {
        if (justEvaluated) {       
            reset();
        }
        current = current === "0" ? value : current + value;  
    }
    else if ("+-*/".includes(value)) {
        if (current === "" && previous !== "") {
            operator = value;                     
        } else if (current !== "") {
            if (previous !== "" && operator !== "") {  
                const result = compute(previous, operator, current);
                if (result === "Error") { reset(); screen.textContent = "Error"; return; }
                previous = String(result);
            } else {
                previous = current;
            }
            operator = value;
            current = "";
            justEvaluated = false;
        }
    }
    else if (value === "=") {
        if (previous === "" || operator === "" || current === "") return;

        const a = previous, op = operator, b = current;   
        const result = compute(a, op, b);
        if (result === "Error") { reset(); screen.textContent = "Error"; return; }

        screen.textContent = `${a} ${op} ${b} = ${result}`;

        previous = "";
        operator = "";
        current = String(result);
        justEvaluated = true;

        if (isEasy(a, op, b)) {
            showRoast(a, op, b);
        } else {
            roastBox.textContent = "";
        }
        return;
    }

    updateScreen();
});

function isEasy(a, op, b) {
    a = Number(a);
    b = Number(b);

    const small = Math.abs(a) < 10 && Math.abs(b) < 10;
    const trivial = a === 0 || b === 0 || a === 1 || b === 1;

    if (op === "+" || op === "-") return small || trivial;
    if (op === "*") return small || trivial;
    if (op === "/") return b === 1 || (Number.isInteger(a / b) && Math.abs(a) < 100);
    return false;
}