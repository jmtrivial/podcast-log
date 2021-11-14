#!/bin/bash


SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FILE=$SCRIPT_DIR/../podcast.log
NEWFILE=$SCRIPT_DIR/../podcast-new.log

source $SCRIPT_DIR/config.sh

echo "Source:" $APACHE_LOG_FILE

echo "Récupération des nouvelles lignes"
# get new lines
cat $APACHE_LOG_FILE |grep GET|grep mp3|grep $FILTER|grep [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9] > $NEWFILE

# add new lines to a backup file
cat $FILE $NEWFILE | sort| uniq > $FILE.tmp
mv $FILE.tmp $FILE


DETAILS=$SCRIPT_DIR/../web/details.csv
echo "Détails dans" $DETAILS

# on créé le fichier temporaire
if [ -e $DETAILS ]; then
    cp $DETAILS $DETAILS.new 
else
    echo '"ip";"timestamp";"episode";"html-code";"user-agent"' > $DETAILS.new
fi

# on process seulement les nouvelles lignes que l'on ajoute et que l'on trie
cat $NEWFILE | while read line; do 
    date=$(echo $line|cut -d "[" -f2|cut -d "]" -f1)
    date=`date -d "$(echo $date | sed -e 's,/,-,g' -e 's,:, ,')" +"%s"`
    ip=$(echo $line|cut -d ' ' -f1)
    other=$(echo $line|cut -d ']' -f 2-)
    echo "$ip [$date] $other"
done | sed -n 's/\(.*\) \[\(.*\)\]  \"GET.*\(s[0-9][0-9]e[0-9][0-9]\).* \(20[06]\) .* \"\([^\"]*\)\"$/"\1";"\2";"\3";"\4";"\5"`/p' >> $DETAILS.new

cat $DETAILS.new | sort -r |uniq > $DETAILS

# save file
cp $DETAILS $DETAILS-$(date +%F).backup

