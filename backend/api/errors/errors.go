package errors

import (
	stderrors "errors"
	"fmt"
	"runtime"
	"strings"
)

// Re-export standard library errors functions for convenience

type any = interface{}

func As(err error, target any) bool {
	return stderrors.As(err, target)
}

func Is(err, target error) bool {
	return stderrors.Is(err, target)
}

func Unwrap(err error) error {
	return stderrors.Unwrap(err)
}

type Error struct {
	Code           int    `json:"code"`
	PublicMessage  string `json:"message"`
	PrivateMessage string `json:"-"`
	Cause          error  `json:"-"`
	Trace          string `json:"-"`
}

// New returns an error with the given status code, public message and private message.
func New(code int, publicMsg, privateMsg string) error {

	b := make([]byte, 2048)
	n := runtime.Stack(b, false)
	trace := string(b[:n])
	trace = strings.ReplaceAll(trace, "\n", "\r")

	return &Error{
		Code:           code,
		PublicMessage:  publicMsg,
		PrivateMessage: privateMsg,
		Trace:          trace,
	}
}

// Wrap returns an error with the given status code, public message, private message and cause.
// If the cause is nil, Wrap returns nil.
func Wrap(code int, publicMsg, privateMsg string, cause error) error {
	if cause == nil {
		return nil
	}

	var trace string
	var err *Error
	if As(cause, &err) {
		trace = err.Trace
	} else {
		b := make([]byte, 2048)
		n := runtime.Stack(b, false)
		trace = string(b[:n])
		trace = strings.ReplaceAll(trace, "\n", "\r")
	}

	return &Error{
		Code:           code,
		PublicMessage:  publicMsg,
		PrivateMessage: privateMsg,
		Cause:          cause,
		Trace:          trace,
	}
}

// Unwrap returns the cause of the given error.
func (e *Error) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func toString(err error, depth int) string {
	if err == nil {
		return "nil"
	}

	const tab = "    " // 4 spaces
	var separator = "\r" + strings.Repeat(tab, depth)

	var b strings.Builder
	b.WriteString("{")
	b.WriteString(separator)

	var e *Error
	if As(err, &e) {
		b.WriteString(fmt.Sprintf("Code: %d,", e.Code))
		b.WriteString(separator)

		b.WriteString(fmt.Sprintf("Public Message: %s,", e.PublicMessage))
		b.WriteString(separator)

		b.WriteString(fmt.Sprintf("Private Message: %s,", e.PrivateMessage))
		b.WriteString(separator)

		b.WriteString(fmt.Sprintf("Cause: %s,", toString(e.Cause, depth+1)))
		b.WriteString("\r")
		b.WriteString(strings.Repeat(tab, depth-1))
		b.WriteString("}")

		if depth == 1 {
			b.WriteString("\r\r")
			b.WriteString(e.Trace)
			b.WriteString("\n")
		}
	} else {
		b.WriteString(fmt.Sprintf("Public Message: %s", err))
		b.WriteString(separator)

		b.WriteString(fmt.Sprintf("Cause: %s,", toString(Unwrap(err), depth+1)))
		b.WriteString("\r")
		b.WriteString(strings.Repeat(tab, depth-1))
		b.WriteString("}")
	}

	return b.String()
}

// Error returns a description of the error as a string.
func (e *Error) Error() string {
	if e == nil {
		return ""
	}

	return toString(e, 1)
}
