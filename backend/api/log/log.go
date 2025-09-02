package log

import (
	"fmt"
	stdlog "log"
	"os"
	"strings"
)

var isTest = os.Getenv("IS_TEST") == "true"

type logLevel int

type any = interface{}

const (
	// Log level for testing.
	TestLevel logLevel = iota

	// Log level for critical application failures.
	ErrorLevel

	// Log level for non-critical failures.
	WarnLevel

	// Log level for informational messages.
	InfoLevel

	// Log level for debugging messages.
	DebugLevel
)

type logger struct {
	level     logLevel
	requestId string
}

var defaultLogger = logger{
	level:     DebugLevel,
	requestId: "",
}

func init() {
	if isTest {
		defaultLogger.level = TestLevel
	}
}

// SetLevel sets the current logging level.
func SetLevel(level logLevel) {
	defaultLogger.level = level
}

// SetRequestId sets the request id associated with future logs.
func SetRequestId(requestId string) {
	defaultLogger.requestId = requestId
}

// levelPrint prints the provided arguments prefixed by the provided level name
// and the current request id.
func levelPrint(level string, v ...any) {
	result := fmt.Sprint(v...)
	if !isTest {
		result = strings.ReplaceAll(result, "\n", "\r")
	}
	stdlog.Printf("[%s] - [%s]: %s", defaultLogger.requestId, level, result)
}

// levelPrint prints the provided format string prefixed by the provided level name
// and the current request id.
func levelPrintf(level, format string, v ...any) {
	result := fmt.Sprintf(format, v...)
	if !isTest {
		result = strings.ReplaceAll(result, "\n", "\r")
	}
	stdlog.Printf("[%s] - [%s]: %s", defaultLogger.requestId, level, result)
}

// Error prints the provided arguments only if the current log level is
// >= ErrorLevel.
func Error(v ...any) {
	if defaultLogger.level >= ErrorLevel {
		levelPrint("ERROR", v...)
	}
}

// Errorf prints the provided format string and arguments only if the
// current log level is >= ErrorLevel.
func Errorf(format string, v ...any) {
	if defaultLogger.level >= ErrorLevel {
		levelPrintf("ERROR", format, v...)
	}
}

// Warn prints the provided arguments only if the current log level is
// >= WarnLevel.
func Warn(v ...any) {
	if defaultLogger.level >= WarnLevel {
		levelPrint("WARN", v...)
	}
}

// Warnf prints the provided format string and arguments only if the
// current log level is >= WarnLevel.
func Warnf(format string, v ...any) {
	if defaultLogger.level >= WarnLevel {
		levelPrintf("WARN", format, v...)
	}
}

// Info prints the provided arguments only if the current log level is
// >= InfoLevel.
func Info(v ...any) {
	if defaultLogger.level >= InfoLevel {
		levelPrint("INFO", v...)
	}
}

// Infof prints the provided format string and arguments only if the
// current log level is >= InfoLevel.
func Infof(format string, v ...any) {
	if defaultLogger.level >= InfoLevel {
		levelPrintf("INFO", format, v...)
	}
}

// Debug prints the provided arguments only if the current log level is
// >= DebugLevel.
func Debug(v ...any) {
	if defaultLogger.level >= DebugLevel {
		levelPrint("DEBUG", v...)
	}
}

// Debugf prints the provided format string and arguments only if the
// current log level is >= DebugLevel.
func Debugf(format string, v ...any) {
	if defaultLogger.level >= DebugLevel {
		levelPrintf("DEBUG", format, v...)
	}
}
