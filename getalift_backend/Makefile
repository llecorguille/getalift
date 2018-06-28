prog: y.tab.h lex.yy.c
	gcc lex.yy.c -o prog -lfl -std=c99

y.tab.h:
	yacc -d yacc.y

lex.yy.c:
	flex parser.l

clean:
	rm -f lex.yy.c y.tab.c y.tab.h prog
