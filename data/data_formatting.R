setwd("~/Dropbox (Dropbox @RU)/InteractiveVis/final/data/")

dt <- read.csv("owid-energy-data.csv")
unique(dt$year)
dt.names <- dt[dt$year=="2019","country"]
dt.16 <- dt[dt$year=="2019",]
rownames(dt.16) <- dt.16$country

library("rjson")
asia <- fromJSON(file="asia.geo.json")

json.names <- vector()
json.econ <- vector()
json.income <- vector()

for (c in asia$features) {
  json.names <- append(json.names, c$properties$admin)
  json.econ <- append(json.econ, c$properties$economy)
  json.income <- append(json.income, c$properties$income_grp)
}
gsub("([0-9]+)\\. ", "", unique(json.econ))
gsub("([0-9]+)\\. ", "", unique(json.income))

json.names
json.names[json.names %in% dt.names] # in the data
json.names[!json.names %in% dt.names] # not in the data
target.dt.names <- json.names[json.names %in% dt.names]
#target.dt.names <- append(target.dt.names,  as.vector(dt.names[grep("Korea",dt.names)]))
#target.dt.names <- append(target.dt.names,  as.vector(dt.names[grep("Timor",dt.names)]))

dt.16 <- dt.16[dt.16$country %in% target.dt.names,]
#View(colnames(dt.16))

tgt <- "_consumption"
colnames(dt.16)[grep("oil", colnames(dt.16))]
colnames(dt.16)[grep(tgt,colnames(dt.16[target.dt.names %in% dt.16$country,]))]
tgt.col.index <- grep(tgt,colnames(dt.16[target.dt.names %in% dt.16$country,]))



dt.16.e <- dt.16[,tgt.col.index]
dt.16.e$country <- rownames(dt.16)

dt.16.e[,1] <-NULL

dt.16.e[is.na(dt.16.e)] <- 0

colnames(dt.16.e) <- gsub(tgt,"",colnames(dt.16.e))
#write.csv(dt.16.e, file="data.19.csv")

# Replace No "Consumption" Countries Entry with "Electricity"
table(rowSums(dt.16.e[,1:12]) == 0)
write.csv(dt.16.e[rowSums(dt.16.e[,1:12]) == 0,"country"],file="nodata_list.csv")
no_consumption <- dt.16.e[rowSums(dt.16.e[,1:12]) == 0,"country"]

no_cons_df <- dt.16[dt.16$country %in% no_consumption,]
colnames(no_cons_df)[grep("_electricity",colnames(no_cons_df))]
no_cons_df <- no_cons_df[,colnames(no_cons_df)[grep("_electricity",colnames(no_cons_df))]]
no_cons_df[is.na(no_cons_df)] <- 0
colnames(no_cons_df)<-gsub("_electricity","",colnames(no_cons_df))

no_cons_df<-no_cons_df[,colnames(no_cons_df) %in% colnames(dt.16.e)]
no_cons_df$country <- rownames(no_cons_df)

dt.16.e<-dt.16.e[,colnames(no_cons_df)]
dt.16.e<-dt.16.e[!dt.16.e$country %in% no_consumption,] # Select only those with some consumption data

identical(colnames(dt.16.e), colnames(no_cons_df)) # must be true
dt.final <- rbind(dt.16.e, no_cons_df)

write.csv(dt.final, file="data.19.csv")
#tgt.col.index <- grep("energy_per_capita",colnames(dt.16[target.dt.names %in% dt.16$country,]))
#colnames(dt.16)[tgt.col.index]

###############################
#### Convert .csv to .json ####
###############################
# fos <- as.list(dt.16$fossil)
# names(fos)<- rep("value",46)
# 
# fos<-cbind(rep("fossil",46),dt.16$fossil)
# colnames(fos) <- c("source","value")
# fos<-as.data.frame(fos)
# fos$value <- as.numeric(as.character(fos$value))
# fos<-as.list(split(fos, 1:nrow(fos)))
# names(fos) <- rownames(dt.16)
# 
# oil<-cbind(rep("oil",46),dt.16$oil)
# colnames(oil) <- c("source","value")
# oil<-as.data.frame(oil)
# oil$value <- as.numeric(as.character(oil$value))
# oil<-as.list(split(oil, 1:nrow(oil)))
# names(oil) <- rownames(dt.16)
# 
# cat(toJSON(fos, indent=1))
# 
# cat(toJSON(list(fos=fos, oil=oil), indent=1))
#
#
#
##############################
#### Import & Export data ####
##############################
export <- read.csv("Export.Crude.2019.csv")
import <- read.csv("Import.Crude.2019.csv")  
# Filter by Asia
import<-subset(import, import$Continent=="Asia")
export<-subset(export, export$Continent=="Asia")
# Sort
import<-import[order(-import$Trade.Value),]
export<-export[order(-export$Trade.Value),]
# Fix Names
import$Country <- recode(import$Country, "Chinese Taipei"="Taiwan")
export$Country <- recode(export$Country, "Chinese Taipei"="Taiwan")
# Check Names
import$Country %in% dt.names
export$Country[!export$Country %in% dt.names]

# Convert to Dallar Notation
library('scales')
dollar(sum(import$Trade.Value))
dollar(sum(export$Trade.Value))

import$USD <- dollar(import$Trade.Value)
export$USD <- dollar(export$Trade.Value)
# calculate percentage
import$"% (Asia)" <- paste(round(import$Trade.Value / sum(import$Trade.Value) * 100,1), "%", sep=" ")
export$"% (Asia)" <- paste(round(export$Trade.Value / sum(export$Trade.Value) * 100,1), "%", sep=" ")

# Subset and save
import <- import[,c("Country","USD","% (Asia)")]
export <- export[,c("Country","USD","% (Asia)")]

write.csv(import[1:20,], file="Import.19.csv", row.names = FALSE)
write.csv(export[1:20,], file="Export.19.csv", row.names = FALSE)







