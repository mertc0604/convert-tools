package io.github.mertc0604.converttools.units;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.Objects;

public record Rational(BigInteger numerator, BigInteger denominator) {
    public Rational {
        Objects.requireNonNull(numerator, "numerator");
        Objects.requireNonNull(denominator, "denominator");
        if (denominator.signum() == 0) {
            throw new ArithmeticException("Division by zero is not allowed.");
        }

        if (denominator.signum() < 0) {
            numerator = numerator.negate();
            denominator = denominator.negate();
        }

        if (numerator.signum() == 0) {
            denominator = BigInteger.ONE;
        } else {
            BigInteger divisor = numerator.gcd(denominator);
            numerator = numerator.divide(divisor);
            denominator = denominator.divide(divisor);
        }
    }

    public static Rational of(long numerator, long denominator) {
        return new Rational(
                BigInteger.valueOf(numerator),
                BigInteger.valueOf(denominator)
        );
    }

    public static Rational parse(String input) {
        String normalized = Objects.requireNonNull(input, "input")
                .trim()
                .replaceAll("\\s+", "")
                .replace(',', '.');
        if (!normalized.matches(
                "[+-]?(?:(?:\\d+(?:\\.\\d*)?)|(?:\\.\\d+))(?:[eE][+-]?\\d+)?"
        )) {
            throw new IllegalArgumentException("Enter a valid decimal number.");
        }

        BigDecimal decimal = new BigDecimal(normalized);
        BigInteger numerator = decimal.unscaledValue();
        int scale = decimal.scale();
        if (scale < 0) {
            return new Rational(
                    numerator.multiply(BigInteger.TEN.pow(-scale)),
                    BigInteger.ONE
            );
        }
        return new Rational(numerator, BigInteger.TEN.pow(scale));
    }

    public Rational add(Rational other) {
        return new Rational(
                numerator.multiply(other.denominator)
                        .add(other.numerator.multiply(denominator)),
                denominator.multiply(other.denominator)
        );
    }

    public Rational subtract(Rational other) {
        return new Rational(
                numerator.multiply(other.denominator)
                        .subtract(other.numerator.multiply(denominator)),
                denominator.multiply(other.denominator)
        );
    }

    public Rational multiply(Rational other) {
        return new Rational(
                numerator.multiply(other.numerator),
                denominator.multiply(other.denominator)
        );
    }

    public Rational divide(Rational other) {
        if (other.numerator.signum() == 0) {
            throw new ArithmeticException("Division by zero is not allowed.");
        }
        return new Rational(
                numerator.multiply(other.denominator),
                denominator.multiply(other.numerator)
        );
    }

    public boolean hasTerminatingDecimal() {
        return exactFractionDigits() != null;
    }

    public Integer exactFractionDigits() {
        BigInteger value = denominator;
        BigInteger two = BigInteger.TWO;
        BigInteger five = BigInteger.valueOf(5);
        int twos = 0;
        int fives = 0;
        while (value.mod(two).signum() == 0) {
            value = value.divide(two);
            twos++;
        }
        while (value.mod(five).signum() == 0) {
            value = value.divide(five);
            fives++;
        }
        return value.equals(BigInteger.ONE) ? Math.max(twos, fives) : null;
    }

    public String format(int maximumFractionDigits) {
        if (maximumFractionDigits < 0 || maximumFractionDigits > 60) {
            throw new IllegalArgumentException(
                    "maximumFractionDigits must be between 0 and 60."
            );
        }
        BigDecimal decimal = new BigDecimal(numerator).divide(
                new BigDecimal(denominator),
                maximumFractionDigits,
                RoundingMode.HALF_UP
        );
        String output = decimal.stripTrailingZeros().toPlainString();
        return output.equals("-0") ? "0" : output;
    }
}
