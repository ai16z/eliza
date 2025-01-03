# Copyright (C) 2024 Gramine contributors
# SPDX-License-Identifier: BSD-3-Clause

THIS_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
NODEJS_DIR ?= /usr/bin

ARCH_LIBDIR ?= /lib/$(shell $(CC) -dumpmachine)

ifeq ($(DEBUG),1)
GRAMINE_LOG_LEVEL = debug
else
GRAMINE_LOG_LEVEL = error
endif

.PHONY: all
all: eliza.manifest
ifeq ($(SGX),1)
all: eliza.manifest.sgx eliza.sig
endif

.PHONY: eliza.manifest
eliza.manifest: eliza.manifest.template
	gramine-manifest \
		-Dlog_level=$(GRAMINE_LOG_LEVEL) \
		-Darch_libdir=$(ARCH_LIBDIR) \
		-Dnodejs_dir=$(NODEJS_DIR) \
		$< >$@

# Make on Ubuntu <= 20.04 doesn't support "Rules with Grouped Targets" (`&:`),
# for details on this workaround see
# https://github.com/gramineproject/gramine/blob/e8735ea06c/CI-Examples/helloworld/Makefile
eliza.manifest.sgx eliza.sig: sgx_sign
	@:

.INTERMEDIATE: sgx_sign
sgx_sign: eliza.manifest
	gramine-sgx-sign \
		--manifest $< \
		--output $<.sgx

ifeq ($(SGX),)
GRAMINE = gramine-direct
else
GRAMINE = gramine-sgx
endif

# Start the default character:
# SGX=1 make start
# Start a specific character by passing arguments:
# SGX=1 make start -- --character "character/your_character_file.json"
.PHONY: start
start: all
	$(GRAMINE) ./eliza --loader ts-node/esm src/index.ts --isRoot $(filter-out $@,$(MAKECMDGOALS))
.PHONY: clean
clean:
	$(RM) *.manifest *.manifest.sgx *.sig

.PHONY: distclean
distclean: clean