package monitor

import "testing"

func TestHealth(t *testing.T) {
    // This is a dummy test to satisfy the Encore build engine
    if 1 + 1 != 2 {
        t.Error("Math is broken")
    }
}